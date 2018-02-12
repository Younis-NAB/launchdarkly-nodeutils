import { LaunchDarklyUtils } from './src/LaunchDarklyUtils';
import { LaunchDarklyLogger } from './src/LaunchDarklyLogger';
import { default as dotenv } from 'dotenv';
dotenv.config();

let log = LaunchDarklyLogger.logger();

let args = process.argv.slice(2);
log.debug(`command line args: ${args}`);

(async () => {

    let ldUtils = await new LaunchDarklyUtils().create(process.env.LAUNCHDARKLY_API_TOKEN, log);

    let mode = args[0];
    let result;
    let projectKey, featureFlagKey, environmentKeyQuery, customRoleKey;

    switch (mode) {
        case 'getFeatureFlags':
            projectKey = args[1];
            if (!projectKey || projectKey.trim() === '') {
                result = 'please supply a projectKey as second parameter'
                break;
            }
            result = await ldUtils.flags.getFeatureFlags(projectKey);
            break;

        case 'getFeatureFlag':
            projectKey = args[1];
            featureFlagKey = args[2];
            environmentKeyQuery = args[3];
            if (!projectKey || projectKey.trim() === '') {
                result = 'please supply a projectKey as second parameter';
                break;
            }
            if (!featureFlagKey || featureFlagKey.trim() === '') {
                result = 'please supply a featureFlagKey as third parameter';
                break;
            }
            if (!environmentKeyQuery || environmentKeyQuery.trim() === '') {
                result = 'please supply a environmentKeyQuery as fourth parameter';
                break;
            }
            result = await ldUtils.flags.getFeatureFlag(projectKey, featureFlagKey, environmentKeyQuery);
            break;

        case 'getFeatureFlagState':
            projectKey = args[1];
            featureFlagKey = args[2];
            environmentKeyQuery = args[3];
            if (!projectKey || projectKey.trim() === '') {
                result = 'please supply a projectKey as second parameter';
                break;
            }
            if (!featureFlagKey || featureFlagKey.trim() === '') {
                result = 'please supply a featureFlagKey as third parameter';
                break;
            }
            if (!environmentKeyQuery || environmentKeyQuery.trim() === '') {
                result = 'please supply a environmentKeyQuery as fourth parameter';
                break;
            }
            result = await ldUtils.flags.getFeatureFlagState(projectKey, featureFlagKey, environmentKeyQuery);
            break;

        case 'toggleFeatureFlag':
            projectKey = args[1];
            featureFlagKey = args[2];
            environmentKeyQuery = args[3];
            if (!projectKey || projectKey.trim() === '') {
                result = 'please supply a projectKey as second parameter';
                break;
            }
            if (!featureFlagKey || featureFlagKey.trim() === '') {
                result = 'please supply a featureFlagKey as third parameter';
                break;
            }
            if (!environmentKeyQuery || environmentKeyQuery.trim() === '') {
                result = 'please supply a environmentKeyQuery as fourth parameter';
                break;
            }
            let enabled = args[4];
            if (enabled === undefined || !['true', 'false'].includes(enabled)) {
                result = `please supply either 'true' or 'false' as fifth parameter`;
                break;
            }
            enabled = enabled === 'true';
            result = await ldUtils.flags.toggleFeatureFlag(projectKey, featureFlagKey, environmentKeyQuery, enabled);
            break;

        case 'getCustomRoles':
            result = await ldUtils.roles.getCustomRoles();
            break;

        case 'getCustomRole':
            customRoleKey = args[1];
            if (!customRoleKey || customRoleKey.trim() === '') {
                result = 'please supply a customRoleKey as second parameter'
                break;
            }
            result = await ldUtils.roles.getCustomRole(customRoleKey);
            break;

        case 'createCustomRole':
            customRoleKey = args[1];
            let customRoleName = args[2];
            let customRolePolicyArray = JSON.parse(args[3]);
            let customRoleDescription = args[4];

            if (!customRoleKey || customRoleKey.trim() === '') {
                result = 'please supply a customRoleKey as second parameter';
                break;
            }

            if (!customRoleName || customRoleName.trim() === '') {
                result = 'please supply a customRoleName as third parameter';
                break;
            }

            if (!customRolePolicyArray) {
                result = 'please supply a customRolePolicyArray as fourth parameter';
                break;
            }

            result = await ldUtils.roles.createCustomRole(
                customRoleKey,
                customRoleName,
                customRolePolicyArray,
                customRoleDescription
            );

            break;

        case 'updateCustomRole':
            customRoleKey = args[1];
            customRoleName = args[2];
            customRolePolicyArray = JSON.parse(args[3]);
            customRoleDescription = args[4];

            if (!customRoleKey || customRoleKey.trim() === '') {
                result = 'please supply a customRoleKey as second parameter';
                break;
            }

            if (!customRoleName || customRoleName.trim() === '') {
                result = 'please supply a customRoleName as third parameter';
                break;
            }

            if (!customRolePolicyArray) {
                result = 'please supply a customRolePolicyArray as fourth parameter';
                break;
            }
            result = await ldUtils.roles.updateCustomRole(
                customRoleKey,
                customRoleName,
                customRolePolicyArray,
                customRoleDescription
            );
            break;

        case 'upsertCustomRole':
            customRoleKey = args[1];
            customRoleName = args[2];
            customRolePolicyArray = JSON.parse(args[3]);
            customRoleDescription = args[4];

            if (!customRoleKey || customRoleKey.trim() === '') {
                result = 'please supply a customRoleKey as second parameter';
                break;
            }

            if (!customRoleName || customRoleName.trim() === '') {
                result = 'please supply a customRoleName as third parameter';
                break;
            }

            if (!customRolePolicyArray) {
                result = 'please supply a customRolePolicyArray as fourth parameter';
                break;
            }
            result = await ldUtils.roles.upsertCustomRole(
                customRoleKey,
                customRoleName,
                customRolePolicyArray,
                customRoleDescription
            );
            break;

        case 'bulkUpsertCustomRoles':
            let roleBulkLoadFile = args[1];
            result = await ldUtils.roles.bulkUpsertCustomRoles(roleBulkLoadFile);

            break;

        case 'bulkUpsertCustomRoleFolder':
            let roleFolder = args[1];
            result = await ldUtils.roles.bulkUpsertCustomRoleFolder(roleFolder);

            break;

        default:
            result = 'Please Supply a Valid Mode Parameter';

    }

    log.info(result);

})();

