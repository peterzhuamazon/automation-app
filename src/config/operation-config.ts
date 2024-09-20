import { Operation } from '../service/operation/operation';
import { Task } from '../service/operation/task';
import { OperationData, TaskData } from './types';
import { Config } from './config';
import { Probot } from 'probot';

export class OperationConfig extends Config {
  private app: Probot;

  private static configSchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      events: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      tasks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            call: {
              type: 'string',
            },
            args: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
            },
          },
          required: ['call', 'args'],
        },
      },
    },
    required: ['name', 'events', 'tasks'],
  };

  constructor(configPath: string, app: Probot) {
    super('OperationConfig');
    this.configData = super.readConfig(configPath);
    this.configSchema = OperationConfig.configSchema;
    super.validateConfig(this.configData, this.configSchema);
    this.app = app;
  }

  public getApp(): Probot {
    return this.app;
  }

  private async _initTasks(taskDataArray: TaskData[]): Promise<Task[]> {
    let taskObjArray: Task[] = [];
    for (const taskData of taskDataArray) {
      const taskObj = new Task(taskData.call, taskData.args, taskData.name);
      console.log(`Setup Task: ${taskObj.getName()}`);
      taskObjArray.push(taskObj);
    }
    return taskObjArray;
  }

  public async initOperation(): Promise<Operation> {
    const opObj = new Operation(
      (this.configData as OperationData).name,
      (this.configData as OperationData).events,
      await this._initTasks((this.configData as OperationData).tasks),
    );
    console.log(`Setup Operation: ${opObj.getName()}`);
    return opObj;
  }
}