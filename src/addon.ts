import { Addon, Resource, capitalize, pluralize, camelize, underscore, singularize } from "kurier";
import { IntermediateResourceClassOptions } from "./types";

export class ManyToManyAddon extends Addon {
  async install(): Promise<void> {
    this.createIntermediateResources();
  }

  async hasManyToManyRelationship(resourceClass: typeof Resource): Promise<boolean> {
    const relationships = Object.entries(resourceClass.schema.relationships);
    return relationships.some(([, relationship]) => relationship.manyToMany);
  }

  private createIntermediateResourceClass({
    resourceType,
    camelCasedForeignResource,
    capitalizedForeignResource,
    foreignKey,
  }: IntermediateResourceClassOptions) {
    const capitalizedLocalResource = pluralize(capitalize(resourceType.name));
    const camelCasedLocalResource = pluralize(camelize(resourceType.name));
    const intermediateResourceType = singularize(camelize(`${camelCasedLocalResource} ${camelCasedForeignResource}`));
    const localForeignKey = underscore(`${resourceType.name}_id`);
    const resourceClassName = `${capitalizedLocalResource}${capitalizedForeignResource}`;

    const newClass = class IntermediateResource extends Resource {
      static get type() {
        return intermediateResourceType;
      }
      static schema = {
        attributes: {},
        relationships: {
          [camelCasedLocalResource]: {
            type: () => resourceType,
            belongsTo: true,
            foreignKeyName: localForeignKey,
            autoInclude: true,
          },
          [camelCasedForeignResource]: {
            type: () => resourceType,
            belongsTo: true,
            foreignKeyName: foreignKey,
            autoInclude: true,
          },
        },
      };
    };

    Object.defineProperty(newClass, "name", {
      value: resourceClassName,
    });

    return newClass;
  }

  private createIntermediateResources() {
    const intermediateTypes = [];
    this.app.types
      .filter((resource) => this.hasManyToManyRelationship(resource))
      .forEach((resource) => {
        Object.entries(resource.schema.relationships).forEach(([relationshipName, relationship]) => {
          if (!relationship.manyToMany) {
            return;
          }

          const capitalizedForeignResource = pluralize(capitalize(relationshipName));
          const camelCasedForeignResource = pluralize(camelize(relationshipName));
          const foreignKey = underscore(`${relationship.type().name}_id`);

          intermediateTypes.push(
            this.createIntermediateResourceClass({
              resourceType: resource,
              camelCasedForeignResource,
              capitalizedForeignResource,
              foreignKey,
            }),
          );
        });
      });
    this.app.types.push(...intermediateTypes);
  }
}
