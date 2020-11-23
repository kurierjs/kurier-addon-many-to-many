import "kurier";
import { Resource } from "kurier";

declare module "kurier" {
  interface ResourceSchemaRelationship {
    manyToMany?: boolean;
    autoInclude?: boolean;
  }
}

export type IntermediateResourceClassOptions = {
  resourceType: typeof Resource;
  capitalizedForeignResource: string;
  camelCasedForeignResource: string;
  foreignKey: string;
};
