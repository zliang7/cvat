/*
 * Copyright (C) 2018 Intel Corporation
 * SPDX-License-Identifier: MIT
*/

/* global
    require:false
    jest:false
    describe:false
*/

// Setup mock for a server
jest.mock('../../src/server-proxy', () => {
    const mock = require('../mocks/server-proxy.mock');
    return mock;
});

// Initialize api
require('../../src/api');

const { Task } = require('../../src/session');


// Test cases
describe('Feature: get a list of tasks', () => {
    test('get all tasks', async () => {
        const result = await window.cvat.tasks.get();
        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(3);
        for (const el of result) {
            expect(el).toBeInstanceOf(Task);
        }
    });

    test('get a task by an id', async () => {
        const result = await window.cvat.tasks.get({
            id: 3,
        });
        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(1);
        expect(result[0]).toBeInstanceOf(Task);
        expect(result[0].id).toBe(3);
    });

    test('get a task by an unknown id', async () => {
        const result = await window.cvat.tasks.get({
            id: 50,
        });
        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(0);
    });

    test('get a task by an invalid id', async () => {
        await expect(window.cvat.tasks.get({
            id: '50',
        })).rejects.toThrow(window.cvat.exceptions.ArgumentError);
    });

    test('get tasks by filters', async () => {
        const result = await window.cvat.tasks.get({
            mode: 'interpolation',
        });
        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(2);
        for (const el of result) {
            expect(el).toBeInstanceOf(Task);
            expect(el.mode).toBe('interpolation');
        }
    });

    test('get tasks by invalid filters', async () => {
        await expect(window.cvat.tasks.get({
            unknown: '5',
        })).rejects.toThrow(window.cvat.exceptions.ArgumentError);
    });

    test('get task by name, status and mode', async () => {
        const result = await window.cvat.tasks.get({
            mode: 'interpolation',
            status: 'annotation',
            name: 'Test Task',
        });
        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(1);
        for (const el of result) {
            expect(el).toBeInstanceOf(Task);
            expect(el.mode).toBe('interpolation');
            expect(el.status).toBe('annotation');
            expect(el.name).toBe('Test Task');
        }
    });
});

describe('Feature: save a task', () => {
    test('save some changed fields in a task', async () => {
        let result = await window.cvat.tasks.get({
            id: 2,
        });

        result[0].bugTracker = 'newBugTracker';
        result[0].zOrder = true;
        result[0].name = 'New Task Name';

        result[0].save();

        result = await window.cvat.tasks.get({
            id: 2,
        });

        expect(result[0].bugTracker).toBe('newBugTracker');
        expect(result[0].zOrder).toBe(true);
        expect(result[0].name).toBe('New Task Name');
    });

    test('save some new labels in a task', async () => {
        let result = await window.cvat.tasks.get({
            id: 2,
        });

        const labelsLength = result[0].labels.length;
        const newLabel = new window.cvat.classes.Label({
            name: 'My boss\'s car',
            attributes: [{
                default_value: 'false',
                input_type: 'checkbox',
                mutable: true,
                name: 'parked',
                values: ['false'],
            }],
        });

        result[0].labels = [newLabel];
        result[0].save();

        result = await window.cvat.tasks.get({
            id: 2,
        });

        expect(result[0].labels).toHaveLength(labelsLength + 1);
        const appendedLabel = result[0].labels.filter(el => el.name === 'My boss\'s car');
        expect(appendedLabel).toHaveLength(1);
        expect(appendedLabel[0].attributes).toHaveLength(1);
        expect(appendedLabel[0].attributes[0].name).toBe('parked');
        expect(appendedLabel[0].attributes[0].defaultValue).toBe('false');
        expect(appendedLabel[0].attributes[0].mutable).toBe(true);
        expect(appendedLabel[0].attributes[0].inputType).toBe('checkbox');
    });

    test('save new task without an id', async () => {
        const task = new window.cvat.classes.Task({
            name: 'New Task',
            labels: [{
                name: 'My boss\'s car',
                attributes: [{
                    default_value: 'false',
                    input_type: 'checkbox',
                    mutable: true,
                    name: 'parked',
                    values: ['false'],
                }],
            }],
            bug_tracker: 'bug tracker value',
            image_quality: 50,
            z_order: true,
        });

        const result = await task.save();
        expect(typeof (result.id)).toBe('number');
    });
});

describe('Feature: delete a task', () => {
    test('delete a task', async () => {
        let result = await window.cvat.tasks.get({
            id: 3,
        });

        result[0].delete();
        result = await window.cvat.tasks.get({
            id: 3,
        });

        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(0);
    });
});


/*
const plugin = {
    name: 'Example Plugin',
    description: 'This example plugin demonstrates how plugin system in CVAT works',
    cvat: {
        server: {
            about: {
                async leave(self, result) {
                    result.plugins = await self.internal.getPlugins();
                    return result;
                },
            },
        },
        classes: {
            Job: {
                prototype: {
                    annotations: {
                        put: {
                            enter(self, objects) {
                                for (const obj of objects) {
                                    if (obj.type !== 'tag') {
                                        const points = obj.position.map((point) => {
                                            const roundPoint = {
                                                x: Math.round(point.x),
                                                y: Math.round(point.y),
                                            };
                                            return roundPoint;
                                        });
                                        obj.points = points;
                                    }
                                }
                            },
                        },
                    },
                },
            },
        },
    },
    internal: {
        async getPlugins() {
            const plugins = await window.cvat.plugins.list();
            return plugins.map((el) => {
                const obj = {
                    name: el.name,
                    description: el.description,
                };
                return obj;
            });
        },
    },
};


async function test() {
    await window.cvat.plugins.register(plugin);
    await window.cvat.server.login('admin', 'nimda760');

    try {
        console.log(JSON.stringify(await window.cvat.server.about()));
        console.log(await window.cvat.users.get({ self: false }));
        console.log(await window.cvat.users.get({ self: true }));
        console.log(JSON.stringify(await window.cvat.jobs.get({ taskID: 8 })));
        console.log(JSON.stringify(await window.cvat.jobs.get({ jobID: 10 })));
        console.log(await window.cvat.tasks.get());
        console.log(await window.cvat.tasks.get({ id: 8 }));
        console.log('Done.');
    } catch (exception) {
        console.log(exception.constructor.name);
        console.log(exception.message);
    }
}
*/
