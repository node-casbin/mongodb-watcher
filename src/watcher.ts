import {MongodbConnection} from './mongodb'
import {Watcher} from "casbin";

export default class MongodbWatcher implements Watcher{

    private readonly keyName : string;
    private mongodbConnection : MongodbConnection;
    private callback : () => void;

    public static async newWatcher(uri : string,dbName: string,collectionName: string,keyName?: string):Promise<MongodbWatcher>{
        return new MongodbWatcher(uri,dbName,collectionName,keyName);
    }

    private constructor(uri: string, dbName: string,collectionName: string, keyName?: string) {
        this.keyName = keyName || "/casbin";
        this.mongodbConnection = new MongodbConnection(uri,dbName,collectionName);
        this.mongodbConnection.open();
        this.mongodbConnection.getCollection().then(collection=>{
           let that = this;
           let latest =  collection.find({}).limit(1);
           latest.next(function (err,doc){
               if (err) throw err;
               let query = {_id: {$gt: doc._id}};
               let options = {tailable:true,awaitData: true, numberOfRetries:-1};
               let cursor = collection.find(query,options);
               (function next(){
                   cursor.next(function (err,message){
                       if (err) throw err;
                       if (message.message === that.keyName){
                           if (that.callback)
                               that.callback();
                       }
                       next();
                   });
               })();
           })
        })
    }
    public setUpdateCallback(callback: () => void): void {
        this.callback = callback;
    }

    public async update(): Promise<boolean> {
        let collection = await this.mongodbConnection.getCollection();
        await collection.insertOne({message:this.keyName,time: Date.now()})
        return true
    }

    public async close(): Promise<void>{
        this.mongodbConnection.close();
    }

}
