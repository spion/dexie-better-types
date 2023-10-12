import Dexie from 'dexie';
import type { Table } from '../'

class MyAppDatabase extends Dexie {
    // Declare implicit table properties.
    // (just to inform Typescript. Instantiated by Dexie in stores() method)
    contacts!: Table<IContact, number>; // number = type of the primkey
    //...other tables goes here...

    constructor () {
        super("MyAppDatabase");
        this.version(1).stores({
            contacts: '++id, first, last',
            //...other tables goes here...
        });
    }
}

interface IContact {
    id?: number,
    first: string,
    last: string
}


const db = new MyAppDatabase();

async function test() {
  let res = await db.contacts.where('someKey').equals('someValue').toArray()
  let res2 = await db.contacts.where('first').equals(1).toArray();

  let res3 = await db.contacts.where(['first', 'last']).equals(['v1', 2]).toArray()
}
