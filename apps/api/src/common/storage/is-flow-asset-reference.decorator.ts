import { registerDecorator, type ValidationOptions } from "class-validator";
import { isAllowedFlowAssetReference } from "./storage-url";

export function IsFlowAssetReference(validationOptions?: ValidationOptions) {
  return function validateFlowAssetReference(
    object: object,
    propertyName: string
  ) {
    registerDecorator({
      name: "isFlowAssetReference",
      target: object.constructor,
      propertyName,
      options: {
        message:
          "$property must be an http(s) URL or a LeadFlow upload path under /uploads/flows/...",
        ...validationOptions
      },
      validator: {
        validate(value: unknown) {
          if (value === null || value === undefined) {
            return true;
          }

          return typeof value === "string" && isAllowedFlowAssetReference(value);
        }
      }
    });
  };
}
