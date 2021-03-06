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

const { Job } = require('../../src/session');


// Test cases
describe('Feature: get a list of jobs', () => {
    test('get jobs by a task id', async () => {
        const result = await window.cvat.jobs.get({
            taskID: 3,
        });
        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(2);
        for (const el of result) {
            expect(el).toBeInstanceOf(Job);
        }

        expect(result[0].task.id).toBe(3);
        expect(result[0].task).toBe(result[1].task);
    });

    test('get jobs by an unknown task id', async () => {
        const result = await window.cvat.jobs.get({
            taskID: 50,
        });
        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(0);
    });


    test('get jobs by a job id', async () => {
        const result = await window.cvat.jobs.get({
            jobID: 1,
        });
        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
    });

    test('get jobs by an unknown job id', async () => {
        const result = await window.cvat.jobs.get({
            taskID: 50,
        });
        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(0);
    });

    test('get jobs by invalid filter with both taskID and jobID', async () => {
        await expect(window.cvat.jobs.get({
            taskID: 1,
            jobID: 1,
        })).rejects.toThrow(window.cvat.exceptions.ArgumentError);
    });

    test('get jobs by invalid job id', async () => {
        await expect(window.cvat.jobs.get({
            jobID: '1',
        })).rejects.toThrow(window.cvat.exceptions.ArgumentError);
    });

    test('get jobs by invalid task id', async () => {
        await expect(window.cvat.jobs.get({
            taskID: '1',
        })).rejects.toThrow(window.cvat.exceptions.ArgumentError);
    });

    test('get jobs by unknown filter', async () => {
        await expect(window.cvat.jobs.get({
            unknown: 50,
        })).rejects.toThrow(window.cvat.exceptions.ArgumentError);
    });
});


describe('Feature: save job', () => {
    test('save status of a job', async () => {
        let result = await window.cvat.jobs.get({
            jobID: 1,
        });

        result[0].status = 'validation';
        await result[0].save();

        result = await window.cvat.jobs.get({
            jobID: 1,
        });
        expect(result[0].status).toBe('validation');
    });

    test('save invalid status of a job', async () => {
        const result = await window.cvat.jobs.get({
            jobID: 1,
        });

        await result[0].save();
        expect(() => {
            result[0].status = 'invalid';
        }).toThrow(window.cvat.exceptions.ArgumentError);
    });
});
