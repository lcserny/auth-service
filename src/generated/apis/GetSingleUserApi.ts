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


import * as runtime from '../runtime';
import type {
  ApplicationErrorResponse,
  UserData,
} from '../models/index';
import {
    ApplicationErrorResponseFromJSON,
    ApplicationErrorResponseToJSON,
    UserDataFromJSON,
    UserDataToJSON,
} from '../models/index';

export interface GetUserRequest {
    id: string;
}

/**
 * GetSingleUserApi - interface
 * 
 * @export
 * @interface GetSingleUserApiInterface
 */
export interface GetSingleUserApiInterface {
    /**
     * 
     * @param {string} id The user ID
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof GetSingleUserApiInterface
     */
    getUserRaw(requestParameters: GetUserRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<UserData>>;

    /**
     */
    getUser(requestParameters: GetUserRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<UserData>;

}

/**
 * 
 */
export class GetSingleUserApi extends runtime.BaseAPI implements GetSingleUserApiInterface {

    /**
     */
    async getUserRaw(requestParameters: GetUserRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<UserData>> {
        if (requestParameters['id'] == null) {
            throw new runtime.RequiredError(
                'id',
                'Required parameter "id" was null or undefined when calling getUser().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/security/users/{id}`.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters['id']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => UserDataFromJSON(jsonValue));
    }

    /**
     */
    async getUser(requestParameters: GetUserRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<UserData> {
        const response = await this.getUserRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
