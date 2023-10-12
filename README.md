# dexie-better-types

Better [types](https://dexie.org/docs/Typescript) for [dexie.js](https://dexie.org/)

The main improvement is in the type safety of `where`, `orderBy` and similar conditions,
which now require that the keys and values passed match the containing type of the `Table`


## how to use

First, install the types

```bash
npm install --save-dev dexie-better-types
```

Then, use the `Table` type coming from `dexie-better-types`, rather than `dexie` itself.

```typescript
import Dexie from 'dexie';
import type { Table } from 'dexie-better-types'

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
```


## example errors

Trying to use the wrong key:

```typescript
let res = await db.contacts.where('someKey').equals('someValue').toArray()
```

gets you an error message like the following

```typescript
No overload matches this call.
  Overload 1 of 2, '(index: KeysOf<IContact>): WhereClause<IContact, KeysOf<IContact>, number>', gave the following error.
    Argument of type '"someKey"' is not assignable to parameter of type 'KeysOf<IContact>'.
  Overload 2 of 2, '(equalityCriterias: Partial<IContact>): Collection<IContact, number>', gave the following error.
    Type '"someKey"' has no properties in common with type 'Partial<IContact>'.ts(2769)
```

The checks work for values too, i.e.

```typescript
let res = await db.contacts.where('first').equals(1).toArray()
```

yields the error

```
Argument of type 'number' is not assignable to parameter of type 'string'.ts(2345)
```

Compound keys up to 5 items are supported

```typescript
// Same error as above
let res = await db.contacts.where(['first', 'last']).equals(['v1', 2]).toArray()
```