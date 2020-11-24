import { Addon, Resource, capitalize, pluralize, camelize, underscore, singularize } from "kurier";
import { IntermediateResourceClassOptions } from "./types";

export class ManyToManyAddon extends Addon {
  async install(): Promise<void> {
    await this.createIntermediateResources();
  }

  async hasManyToManyRelationship(resourceClass: typeof Resource): Promise<boolean> {
    const relationships = Object.entries(resourceClass.schema.relationships);
    return relationships.some(([, relationship]) => relationship.manyToMany);
  }

  private async createIntermediateResourceClass({
    resourceType,
    foreignResourceType,
    camelCasedForeignResource,
    capitalizedForeignResource,
    localForeignKey,
    foreignKey,
  }: IntermediateResourceClassOptions) {
    const capitalizedLocalResource = pluralize(capitalize(resourceType.name));
    const camelCasedLocalResource = pluralize(camelize(resourceType.name));
    const intermediateResourceType = singularize(camelize(`${camelCasedLocalResource} ${camelCasedForeignResource}`));
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
            type: () => foreignResourceType,
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

  private async createIntermediateResources() {
    const intermediateTypes = [];
    await Promise.all(
      this.app.types
        .filter((resource) => this.hasManyToManyRelationship(resource))
        .map(async (resource) => {
          Object.entries(resource.schema.relationships).map(async ([relationshipName, relationship]) => {
            if (!relationship.manyToMany) {
              return;
            }

            const capitalizedForeignResource = pluralize(capitalize(relationshipName));
            const camelCasedForeignResource = pluralize(camelize(relationshipName));
            const foreignKey = underscore(`${relationship.type().name}_id`);
            const localForeignKey = underscore(`${resource.name}_id`);

            const intermediateType = await this.createIntermediateResourceClass({
              resourceType: resource,
              foreignResourceType: relationship.type(),
              camelCasedForeignResource,
              capitalizedForeignResource,
              localForeignKey,
              foreignKey,
            });

            intermediateTypes.push(intermediateType);
          });
        })
    );
    this.app.types.push(...intermediateTypes);
  }
}
