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

import { mapValues } from '../runtime';
import type { UserRole } from './UserRole';
import {
    UserRoleFromJSON,
    UserRoleFromJSONTyped,
    UserRoleToJSON,
} from './UserRole';
import type { UserPerm } from './UserPerm';
import {
    UserPermFromJSON,
    UserPermFromJSONTyped,
    UserPermToJSON,
} from './UserPerm';

/**
 * 
 * @export
 * @interface UserAccess
 */
export interface UserAccess {
    /**
     * 
     * @type {string}
     * @memberof UserAccess
     */
    accessToken: string;
    /**
     * 
     * @type {string}
     * @memberof UserAccess
     */
    userId: string;
    /**
     * 
     * @type {Array<UserRole>}
     * @memberof UserAccess
     */
    roles: Array<UserRole>;
    /**
     * 
     * @type {Array<UserPerm>}
     * @memberof UserAccess
     */
    perms: Array<UserPerm>;
}

/**
 * Check if a given object implements the UserAccess interface.
 */
export function instanceOfUserAccess(value: object): value is UserAccess {
    if (!('accessToken' in value) || value['accessToken'] === undefined) return false;
    if (!('userId' in value) || value['userId'] === undefined) return false;
    if (!('roles' in value) || value['roles'] === undefined) return false;
    if (!('perms' in value) || value['perms'] === undefined) return false;
    return true;
}

export function UserAccessFromJSON(json: any): UserAccess {
    return UserAccessFromJSONTyped(json, false);
}

export function UserAccessFromJSONTyped(json: any, ignoreDiscriminator: boolean): UserAccess {
    if (json == null) {
        return json;
    }
    return {
        
        'accessToken': json['accessToken'],
        'userId': json['userId'],
        'roles': ((json['roles'] as Array<any>).map(UserRoleFromJSON)),
        'perms': ((json['perms'] as Array<any>).map(UserPermFromJSON)),
    };
}

export function UserAccessToJSON(value?: UserAccess | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'accessToken': value['accessToken'],
        'userId': value['userId'],
        'roles': ((value['roles'] as Array<any>).map(UserRoleToJSON)),
        'perms': ((value['perms'] as Array<any>).map(UserPermToJSON)),
    };
}
