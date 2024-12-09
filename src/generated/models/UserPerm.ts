/* tslint:disable */
/* eslint-disable */
/**
 * auth-service API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


/**
 * 
 * @export
 */
export const UserPerm = {
    Read: 'READ',
    Write: 'WRITE'
} as const;
export type UserPerm = typeof UserPerm[keyof typeof UserPerm];


export function instanceOfUserPerm(value: any): boolean {
    for (const key in UserPerm) {
        if (Object.prototype.hasOwnProperty.call(UserPerm, key)) {
            if (UserPerm[key as keyof typeof UserPerm] === value) {
                return true;
            }
        }
    }
    return false;
}

export function UserPermFromJSON(json: any): UserPerm {
    return UserPermFromJSONTyped(json, false);
}

export function UserPermFromJSONTyped(json: any, ignoreDiscriminator: boolean): UserPerm {
    return json as UserPerm;
}

export function UserPermToJSON(value?: UserPerm | null): any {
    return value as any;
}
