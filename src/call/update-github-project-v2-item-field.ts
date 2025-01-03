/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

// Name         : addIssueToGitHubProjectV2
// Description  : add issue to github project v2 based on labels
// Arguments    :
//   - itemId   : (string) the item Node Id when it gets added to a project.
//   - method   : (string) the method to update an item field in a given project, the item must have been already added to a project.
//              : - label: Adding `Roadmap:Releases/Project Health` label will update the `Roadmap` field value of an item to `Releases, Project Health`.
//              :          Field name and value separated by `:` and `/` replaced with ` ,`.
//   - project  : (string) the `<Organization Name>/<Project Number> where the item field belongs to.
//              : Ex: `opensearch-project/206` which is the OpenSearch Roadmap Project
// Requirements : ADDITIONAL_RESOURCE_CONTEXT=true

import { randomBytes } from 'crypto';
import { Probot } from 'probot';
import { Resource } from '../service/resource/resource';
import { validateResourceConfig } from '../utility/verification/verify-resource';

export interface UpdateGithubProjectV2ItemFieldParams {
  itemId: string;
  method: string;
  project: string;
}

export async function validateProject(app: Probot, resource: Resource, project: string): Promise<Boolean> {
  const projOrg = project.split('/')[0];
  const projNum = Number(project.split('/')[1]);
  const projRed = resource.organizations.get(projOrg)?.projects.get(projNum);

  if (!projRed) {
    app.log.error(`Project ${projNum} in organization ${projOrg} is not defined in resource config!`);
    return false;
  }

  return true;
}

export default async function UpdateGithubProjectV2ItemField(
  app: Probot,
  context: any,
  resource: Resource,
  { itemId, method, project }: UpdateGithubProjectV2ItemFieldParams,
): Promise<string | null> {
  if (!(await validateResourceConfig(app, context, resource))) return null;
  if (!(await validateProject(app, resource, project))) return null;

  // Verify triggered event
  if (!context.payload.label) {
    app.log.error("Only 'issues.labeled' event is supported on this call.");
    return null;
  }

  // Verify itemId present
  if (!itemId) {
    app.log.error('No Item Node Id provided in parameter.');
    return null;
  }

  // Verify update method
  if (method != 'label') {
    app.log.error("Only 'label' method is supported in this call at the moment.");
    return null;
  }

  // Update item field
  try {
    app.log.info(`Attempt to update field for item "${itemId}" in project ${project} ...`);
    const mutationId = await randomBytes(20).toString('hex');
    const projectSplit = project.split('/');
    const projectNode = resource.organizations.get(projectSplit[0])?.projects.get(Number(projectSplit[1]));
    const labelName = context.payload.label.name;
    const labelSplit = labelName.split(':');
    const fieldNode = projectNode?.fields.get(labelSplit[0]);
    let fieldOptionMatch = 0;
    if (fieldNode?.fieldType == 'SINGLE_SELECT') {
      for (const fieldOption of fieldNode?.context.options) {
        if (fieldOption.name == labelSplit[1]) {
          fieldOptionMatch += 1;
          const updateItemFieldMutation = `
              mutation {
                updateProjectV2ItemFieldValue(
                  input: {
                    clientMutationId: "${mutationId}",
                    projectId: "${projectNode?.nodeId}",
                    itemId: "${itemId}",
                    fieldId: "${fieldNode?.nodeId}",
                    value: {
                      singleSelectOptionId: "${fieldOption.id}"
                    }
                  }
                ) {
                    projectV2Item {
                      id
                    }
                  }
                }
              `;
          const responseUpdateItemField = await context.octokit.graphql(updateItemFieldMutation);
          app.log.info(responseUpdateItemField);
          break;
        }
      }
    }
    if (fieldOptionMatch == 0) {
      app.log.info(`No match found for ${labelName} in project ${project}`)
    }
  } catch (e) {
    app.log.error(`ERROR: ${e}`);
    return null;
  }

  return null;
}
