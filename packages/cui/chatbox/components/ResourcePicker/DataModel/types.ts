// DataModelItem
export type Item = {
	id: string
	name: string
	icon: string // material icon name
	collection: string // Collection Name
	description: string
	relations: Relation[]
	fields: Field[]
}

// DataModelRelation
export type Relation = {
	id: string
	model: string
	foreign: string
	key: string
	type: 'hasOne' | 'hasMany'
}

// Common Column Types:
export type Field = {
	type:
		| 'ID'
		| 'string'
		| 'integer'
		| 'float'
		| 'decimal'
		| 'datetime'
		| 'date'
		| 'time'
		| 'boolean'
		| 'json'
		| 'text'
		| 'longtext'
		| 'binary'
		| 'enum'
		| string
	name: string
	label: string
}

export type Collection = {
	id: string
	icon: string // material icon name
	name: string
	description: string
}
