import { Mongo } from 'meteor/mongo';

export const Nodes = new Mongo.Collection('nodes');
export const Paths = new Mongo.Collection('paths');