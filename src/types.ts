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
  foreignResourceType: typeof Resource;
  capitalizedForeignResource: string;
  camelCasedForeignResource: string;
  localForeignKey: string;
  foreignKey: string;
};
