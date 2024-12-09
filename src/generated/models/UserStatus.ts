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
export const UserStatus = {
    Active: 'active',
    Inactive: 'inactive'
} as const;
export type UserStatus = typeof UserStatus[keyof typeof UserStatus];


export function instanceOfUserStatus(value: any): boolean {
    for (const key in UserStatus) {
        if (Object.prototype.hasOwnProperty.call(UserStatus, key)) {
            if (UserStatus[key as keyof typeof UserStatus] === value) {
                return true;
            }
        }
    }
    return false;
}

export function UserStatusFromJSON(json: any): UserStatus {
    return UserStatusFromJSONTyped(json, false);
}

export function UserStatusFromJSONTyped(json: any, ignoreDiscriminator: boolean): UserStatus {
    return json as UserStatus;
}

export function UserStatusToJSON(value?: UserStatus | null): any {
    return value as any;
}
