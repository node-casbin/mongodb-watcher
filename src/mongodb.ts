import {MongoClient} from "mongodb";

export class MongodbConnection{
    private readonly uri: string;
    private readonly dbName: string;
    private readonly collectionName: string;
    public client: MongoClient;


    constructor(uri :string, dbName: string, collectionName: string) {
        this.uri = uri;
        this.dbName = dbName;
        this.collectionName = collectionName;
    }


    open(){
       this.client = new MongoClient(this.uri);
    }

    async getCollection(){
        await this.client.connect();
        return this.client.db(this.dbName).collection(this.collectionName);
    }

    public close(){
        this.client.close();
    }
}
