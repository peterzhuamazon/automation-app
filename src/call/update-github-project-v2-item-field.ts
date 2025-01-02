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

// import { randomBytes } from 'crypto';
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

  app.log.info(`Start updating fields for project item "${itemId}" ...`)

  //const orgName = context.payload.organization.login;
  //const repoName = context.payload.repository.name;
  //const issueNumber = context.payload.issue.number;
  // const issueNodeId = context.payload.issue.node_id;

  // Add to project
  //try {
  //  app.log.info(`Attempt to add ${orgName}/${repoName}/${issueNumber} to project ${project}`);
  //  const mutationId = await randomBytes(20).toString('hex');
  //  const projectSplit = project.split('/');
  //  const projectNodeId = resource.organizations.get(projectSplit[0])?.projects.get(Number(projectSplit[1]))?.nodeId;
  //  const addToProjectMutation = `
  //        mutation {
  //          updateProjectV2ItemFieldValue(
  //            input: {
  //              projectId: "${projectNodeId}",
  //              itemId: "${itemId}",
  //              fieldId: "${fieldNodeId}",
  //              value: {
  //                singleSelectOptionId: "${optionId}"
  //              }
  //            }
  //          ) {
  //              projectV2Item {
  //                id
  //              }
  //            }
  //          }
  //        `;
  //  const responseAddToProject = await context.octokit.graphql(addToProjectMutation);
  //  app.log.info(responseAddToProject);
  //} catch (e) {
  //  app.log.error(`ERROR: ${e}`);
  //  return null;
  //}

  return null;
}
