// import { DBCoreTable, IndexableType, IndexableTypeArrayReadonly } from 'dexie'
// import { Collection } from 'dexe'
import type {
  DBCoreTable,
  Dexie,
  IndexableType,
  IndexableTypeArray,
  IndexableTypeArrayReadonly,
  TableHooks,
  TableSchema,
  ThenShortcut
} from 'dexie'

export type KeyPaths<T> = {
  [P in keyof T]: P extends string
    ? T[P] extends Array<infer K>
      ? K extends object // only drill into the array element if it's an object
        ? P | `${P}.${number}` | `${P}.${number}.${KeyPaths<K>}`
        : P | `${P}.${number}`
      : T[P] extends (...args: any[]) => any // Method
      ? never
      : T[P] extends object
      ? P | `${P}.${KeyPaths<T[P]>}`
      : P
    : never
}[keyof T]

export type KeyPathValue<T, PATH> = PATH extends `${infer R}.${infer S}`
  ? R extends keyof T
    ? KeyPathValue<T[R], S>
    : T extends any[]
    ? PATH extends `${number}.${infer S}`
      ? KeyPathValue<T[number], S>
      : void
    : void
  : PATH extends `${number}`
  ? T extends any[]
    ? T[number]
    : void
  : PATH extends keyof T
  ? T[PATH]
  : void

export type UpdateSpec<T> = { [KP in KeyPaths<T>]?: KeyPathValue<T, KP> }

type TupleKeys<T> =
  | [keyof T]
  | [keyof T, keyof T]
  | [keyof T, keyof T, keyof T]
  | [keyof T, keyof T, keyof T, keyof T]
  | [keyof T, keyof T, keyof T, keyof T, keyof T]

type ValuesOfKey<T, K extends KeysOf<T>> = K extends keyof T
  ? T[K]
  : K extends TupleKeys<T>
  ? ValuesOfArrayKey<T, K>
  : never

type ValuesOfArrayKey<T, K extends TupleKeys<T>> = K extends [infer A, ...infer B]
  ? A extends keyof T
    ? B extends TupleKeys<T>
      ? [T[A], ...ValuesOfArrayKey<T, B>]
      : B extends []
      ? [T[A]]
      : [{ a: never }]
    : [{ b: never }]
  : [{ c: never }]

type KeysOf<T> = keyof T | TupleKeys<T>

export interface Table<T = any, TKey = any, TInsertType = T> {
  db: Dexie
  name: string
  schema: TableSchema
  hook: TableHooks<T, TKey>
  core: DBCoreTable

  get(key: TKey): Promise<T | undefined>
  get<R>(key: TKey, thenShortcut: ThenShortcut<T | undefined, R>): Promise<R>
  get(equalityCriterias: Partial<T>): Promise<T | undefined>
  get<R>(equalityCriterias: Partial<T>, thenShortcut: ThenShortcut<T | undefined, R>): Promise<R>
  where<K extends KeysOf<T>>(index: K): WhereClause<T, K, TKey>
  where(equalityCriterias: Partial<T>): Collection<T, TKey>

  filter(fn: (obj: T) => boolean): Collection<T, TKey>

  count(): Promise<number>
  count<R>(thenShortcut: ThenShortcut<number, R>): Promise<R>

  offset(n: number): Collection<T, TKey>

  limit(n: number): Collection<T, TKey>

  each(callback: (obj: T, cursor: { key: any; primaryKey: TKey }) => any): Promise<void>

  toArray(): Promise<Array<T>>
  toArray<R>(thenShortcut: ThenShortcut<T[], R>): Promise<R>

  toCollection(): Collection<T, TKey>
  orderBy(index: KeysOf<T>): Collection<T, TKey>
  reverse(): Collection<T, TKey>
  mapToClass(constructor: Function): Function
  add(item: TInsertType, key?: TKey): Promise<TKey>
  update(
    key: TKey | T,
    changes:
      | UpdateSpec<T>
      | ((obj: T, ctx: { value: any; primKey: IndexableType }) => void | boolean)
  ): Promise<number>
  put(item: TInsertType, key?: TKey): Promise<TKey>
  delete(key: TKey): Promise<void>
  clear(): Promise<void>
  bulkGet(keys: TKey[]): Promise<(T | undefined)[]>

  bulkAdd<B extends boolean>(
    items: readonly TInsertType[],
    keys: IndexableTypeArrayReadonly,
    options: { allKeys: B }
  ): Promise<B extends true ? TKey[] : TKey>
  bulkAdd<B extends boolean>(
    items: readonly TInsertType[],
    options: { allKeys: B }
  ): Promise<B extends true ? TKey[] : TKey>
  bulkAdd(
    items: readonly TInsertType[],
    keys?: IndexableTypeArrayReadonly,
    options?: { allKeys: boolean }
  ): Promise<TKey>

  bulkPut<B extends boolean>(
    items: readonly TInsertType[],
    keys: IndexableTypeArrayReadonly,
    options: { allKeys: B }
  ): Promise<B extends true ? TKey[] : TKey>
  bulkPut<B extends boolean>(
    items: readonly TInsertType[],
    options: { allKeys: B }
  ): Promise<B extends true ? TKey[] : TKey>
  bulkPut(
    items: readonly TInsertType[],
    keys?: IndexableTypeArrayReadonly,
    options?: { allKeys: boolean }
  ): Promise<TKey>

  bulkUpdate(keysAndChanges: ReadonlyArray<{ key: TKey; changes: UpdateSpec<T> }>): Promise<number>

  bulkDelete(keys: TKey[]): Promise<void>
}

export interface WhereClause<T, Key extends KeysOf<T>, TKey = IndexableType> {
  above(key: ValuesOfKey<T, Key>): Collection<T, TKey>
  aboveOrEqual(key: ValuesOfKey<T, Key>): Collection<T, TKey>
  anyOf(keys: ReadonlyArray<IndexableType>): Collection<T, TKey>
  anyOf(...keys: Array<IndexableType>): Collection<T, TKey>
  anyOfIgnoreCase(keys: ValuesOfKey<T, Key>): Collection<T, TKey>
  anyOfIgnoreCase(...keys: string[]): Collection<T, TKey>
  below(key: ValuesOfKey<T, Key>): Collection<T, TKey>
  belowOrEqual(key: ValuesOfKey<T, Key>): Collection<T, TKey>
  between(
    lower: ValuesOfKey<T, Key>,
    upper: ValuesOfKey<T, Key>,
    includeLower?: boolean,
    includeUpper?: boolean
  ): Collection<T, TKey>
  equals(key: ValuesOfKey<T, Key>): Collection<T, TKey>
  equalsIgnoreCase(key: ValuesOfKey<T, Key>): Collection<T, TKey>
  inAnyRange(
    ranges: ReadonlyArray<[ValuesOfKey<T, Key>, ValuesOfKey<T, Key>]>,
    options?: {
      includeLowers?: boolean
      includeUppers?: boolean
    }
  ): Collection<T, TKey>
  startsWith(key: string): Collection<T, TKey>
  startsWithAnyOf(prefixes: string[]): Collection<T, TKey>
  startsWithAnyOf(...prefixes: string[]): Collection<T, TKey>
  startsWithIgnoreCase(key: string): Collection<T, TKey>
  startsWithAnyOfIgnoreCase(prefixes: string[]): Collection<T, TKey>
  startsWithAnyOfIgnoreCase(...prefixes: string[]): Collection<T, TKey>
  noneOf(keys: ReadonlyArray<ValuesOfKey<T, Key>>): Collection<T, TKey>
  notEqual(key: ValuesOfKey<T, Key>): Collection<T, TKey>
}

export interface Collection<T = any, TKey = IndexableType> {
  //db: Database;
  and(filter: (x: T) => boolean): Collection<T, TKey>
  clone(props?: Object): Collection<T, TKey>
  count(): Promise<number>
  count<R>(thenShortcut: ThenShortcut<number, R>): Promise<R>
  distinct(): Collection<T, TKey>
  each(
    callback: (
      obj: T,
      cursor: {
        key: IndexableType
        primaryKey: TKey
      }
    ) => any
  ): Promise<void>
  eachKey(
    callback: (
      key: IndexableType,
      cursor: {
        key: IndexableType
        primaryKey: TKey
      }
    ) => any
  ): Promise<void>
  eachPrimaryKey(
    callback: (
      key: TKey,
      cursor: {
        key: IndexableType
        primaryKey: TKey
      }
    ) => any
  ): Promise<void>
  eachUniqueKey(
    callback: (
      key: IndexableType,
      cursor: {
        key: IndexableType
        primaryKey: TKey
      }
    ) => any
  ): Promise<void>
  filter(filter: (x: T) => boolean): Collection<T, TKey>
  first(): Promise<T | undefined>
  first<R>(thenShortcut: ThenShortcut<T | undefined, R>): Promise<R>
  keys(): Promise<IndexableTypeArray>
  keys<R>(thenShortcut: ThenShortcut<IndexableTypeArray, R>): Promise<R>
  primaryKeys(): Promise<TKey[]>
  primaryKeys<R>(thenShortcut: ThenShortcut<TKey[], R>): Promise<R>
  last(): Promise<T | undefined>
  last<R>(thenShortcut: ThenShortcut<T | undefined, R>): Promise<R>
  limit(n: number): Collection<T, TKey>
  offset(n: number): Collection<T, TKey>
  or<K extends KeysOf<T>>(indexOrPrimayKey: K): WhereClause<T, K, TKey>
  raw(): Collection<T, TKey>
  reverse(): Collection<T, TKey>
  sortBy(keyPath: string): Promise<T[]>
  sortBy<R>(keyPath: string, thenShortcut: ThenShortcut<T[], R>): Promise<R>
  toArray(): Promise<Array<T>>
  toArray<R>(thenShortcut: ThenShortcut<T[], R>): Promise<R>
  uniqueKeys(): Promise<IndexableTypeArray>
  uniqueKeys<R>(thenShortcut: ThenShortcut<IndexableTypeArray, R>): Promise<R>
  until(filter: (value: T) => boolean, includeStopEntry?: boolean): Collection<T, TKey>
  // Mutating methods
  delete(): Promise<number>
  modify(
    changeCallback: (
      obj: T,
      ctx: {
        value: T
      }
    ) => void | boolean
  ): Promise<number>
  modify(changes: { [keyPath: string]: any }): Promise<number>
}
