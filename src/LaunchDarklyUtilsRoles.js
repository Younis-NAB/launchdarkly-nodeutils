import { default as jsonPatch } from 'fast-json-patch';
import { default as fs } from 'fs';
import { default as path } from 'path';
import { default as globule } from 'globule';
import { default as _ } from 'lodash';

// Class representing Custom role functionality
export class LaunchDarklyUtilsRoles {
    /**
     * Custom role specific api functions attached as 'LaunchDarklyUtils.roles'
     * @constructor LaunchDarklyUtilsRoles
     * @param { Swagger } apiClient - generated launchdarkly apiClient
     * @param { Object } log - logger implementation, or 'console'
     * @param { LaunchDarklyUtils } ldUtils - primary utils class
     * @returns { LaunchDarklyUtilsRoles } custom flag api functions
     */
    constructor(apiClient, log, ldUtils) {
        this.log = log;
        this.apiClient = apiClient;
        this.ldUtils = ldUtils;
        if (!this.ldUtils) {
            throw {
                message: 'LaunchDarklyUtilsRoles constructor requires ldUtils parameter'
            };
        }
    }

    /**
     * Api group object key in LD api
     * @returns {string}
     */
    get API_GROUP() {
        return 'Custom roles';
    }

    /**
     * Get all custom roles in account
     * @returns {Promise}
     * @fulfil {Object} custom role list json
     * @reject {Error} object with message
     */
    async getCustomRoles() {
        try {
            return this.apiClient.apis[this.API_GROUP].getCustomRoles().then(response => {
                return response.body;
            });
        } catch (e) {
            throw {
                api: 'getCustomRoles',
                message: e.message,
                docs: 'https://apidocs.launchdarkly.com/docs/list-custom-roles'
            };
        }
    }

    /**
     * Get a single custom role by key
     * @param {string} customRoleKey - custom role key
     * @returns {Promise}
     * @fulfil {Object} custom role json
     * @reject {Error} object with message
     */
    async getCustomRole(customRoleKey) {
        try {
            return this.apiClient.apis[this.API_GROUP]
                .getCustomRole({ customRoleKey: customRoleKey })
                .then(response => {
                    return response.body;
                });
        } catch (e) {
            throw {
                api: 'getCustomRole',
                message: e.message,
                docs: 'https://apidocs.launchdarkly.com/docs/list-custom-roles'
            };
        }
    }

    /**
     * Get a single role by _id
     * @param {string} customRoleId - custom role _id
     * @returns {Promise}
     * @fulfil {Object} custom role json
     * @reject {Error} object with message
     */
    async getCustomRoleById(customRoleId) {
        return this.apiClient.apis[this.API_GROUP].getCustomRoles().then(roleList => {
            let roles = _.filter(roleList.body.items, { _id: customRoleId });

            if (roles.length !== 1) {
                throw {
                    api: 'getCustomRoles',
                    message: `role not found for _id ${customRoleId}`,
                    docs: 'https://apidocs.launchdarkly.com/docs/list-custom-roles'
                };
            }

            return this.getCustomRole(roles[0].key);
        });
    }

    /**
     * Create a new custom role
     * @param {string} customRoleKey - custom role key
     * @param {string} customRoleName - custom role name
     * @param {string} customRolePolicyArray - array of policy objects per https://docs.launchdarkly.com/docs/custom-roles
     * @param {string} customRoleDescription - user friendly description
     * @returns {Promise}
     * @fulfil {Object} custom role json
     * @reject {Error} object with message
     */
    async createCustomRole(customRoleKey, customRoleName, customRolePolicyArray, customRoleDescription) {
        let customRole = {
            name: customRoleName,
            key: customRoleKey,
            description: customRoleDescription,
            policy: customRolePolicyArray
        };
        try {
            return this.apiClient.apis[this.API_GROUP].postCustomRole({ customRoleBody: customRole }).then(response => {
                return response.body;
            });
        } catch (e) {
            throw {
                api: 'postCustomRole',
                message: e.message,
                docs: 'https://apidocs.launchdarkly.com/docs/create-custom-role'
            };
        }
    }

    /**
     * Update an existing custom role
     * @param {string} customRoleKey - custom role key
     * @param {string} customRoleName - custom role name
     * @param {string} customRolePolicyArray - array of policy objects per https://docs.launchdarkly.com/docs/custom-roles
     * @param {string} customRoleDescription - user friendly description
     * @returns {Promise}
     * @fulfil {Object} updated custom role json
     * @reject {Error} object with message
     */
    async updateCustomRole(customRoleKey, customRoleName, customRolePolicyArray, customRoleDescription) {
        let updatedCustomRole = {
            name: customRoleName,
            key: customRoleKey,
            description: customRoleDescription,
            policy: customRolePolicyArray
        };

        let that = this;
        return this.getCustomRole(customRoleKey)

            .then(customRole => {
                let patchDelta = jsonPatch.compare(customRole, updatedCustomRole);
                that.log.debug(`customRoleDiff for '${customRoleKey}' ${JSON.stringify(patchDelta)}`);
                return patchDelta;
            })
            .then(patchDelta => {
                try {
                    return this.apiClient.apis[this.API_GROUP]
                        .patchCustomRole({
                            customRoleKey: customRoleKey,
                            patchDelta: patchDelta
                        })
                        .then(response => {
                            return response.body;
                        });
                } catch (e) {
                    throw {
                        api: 'patchCustomRole',
                        message: e.message,
                        docs: 'https://apidocs.launchdarkly.com/docs/update-custom-role'
                    };
                }
            });
    }

    /**
     * Check for existence of role by key; update if exists, otherwise create new role
     * @param {string} customRoleKey - custom role key
     * @param {string} customRoleName - custom role name
     * @param {string} customRolePolicyArray - array of policy objects per https://docs.launchdarkly.com/docs/custom-roles
     * @param {string} customRoleDescription - user friendly description
     * @returns {Promise}
     * @fulfil {Object} updated/created custom role json
     * @reject {Error} object with message
     */
    async upsertCustomRole(customRoleKey, customRoleName, customRolePolicyArray, customRoleDescription) {
        let that = this;
        return this.getCustomRole(customRoleKey)

            .then(() => {
                that.log.debug(`Role '${customRoleKey}' Found, Updating...`);
                return this.updateCustomRole(
                    customRoleKey,
                    customRoleName,
                    customRolePolicyArray,
                    customRoleDescription
                );
            })

            .catch(() => {
                that.log.debug(`Role '${customRoleKey}' Not Found, Creating...`);
                return this.createCustomRole(
                    customRoleKey,
                    customRoleName,
                    customRolePolicyArray,
                    customRoleDescription
                );
            });
    }

    /**
     * Load a file of custom role json, and update/create roles based on this
     * @param {string} roleBulkLoadFile - path to json file (eg. exampleRoleBulkLoad.json)
     * @returns {Promise}
     * @fulfil {Object} array of updated/created role json
     * @reject {Error} object with message
     */
    async bulkUpsertCustomRoles(roleBulkLoadFile) {
        let filePath = path.resolve(roleBulkLoadFile);
        let roles = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        let that = this;

        this.log.debug(`Bulk Upserting Roles from File: ${filePath}`);

        return roles.reduce(function(acc, role) {
            return acc.then(function(results) {
                return that.upsertCustomRole(role.key, role.name, role.policy, role.description).then(function(data) {
                    results.push(data);
                    return results;
                });
            });
        }, Promise.resolve([]));
    }

    /**
     * Create/update custom roles based on a folder of multiple json files
     * @param {string} roleFolder - path to folder containing json
     * @returns {Promise}
     * @fulfil {Object} array of updated/created role json
     * @reject {Error} object with message
     */
    async bulkUpsertCustomRoleFolder(roleFolder) {
        let folderPath = path.normalize(path.resolve(roleFolder));
        let globMatch = folderPath + '/*.json';
        this.log.debug(`Looking for Files with Pattern '${globMatch}'`);
        let fileArray = globule.find(globMatch);
        let results = [];
        let that = this;
        fileArray.forEach(async function(file) {
            that.log.debug(`Found File '${file}'. Calling 'bulkUpsertCustomRoles'`);
            let result = await that.bulkUpsertCustomRoles(file);
            results.push(result);
        });
        return results;
    }
}
