const Map = require('../model/mapModel');
const { v4: uuidv4 } = require('uuid');

// Create a new map
const createMap = async (ctx) => {
    try {
        const { name, description, width, height, minThreshold, startPoint, endPoint, obstacles, dividColor } = ctx.request.body;
        const updatedObstacles = obstacles.map(obstacle => ({
            ...obstacle,
            id: uuidv4()
        }));

        await Map.create({
            name,
            description,
            width,
            height,
            startPoint,
            endPoint,
            obstacles: updatedObstacles,
            dividColor,
            minThreshold,
            userId: ctx.user.id
        });
        ctx.status = 204;
    } catch (error) {
        ctx.status = 500;
        ctx.body = { message: 'Error creating map', error };
    }
};

// Read all maps
const getAllMaps = async (ctx) => {
    try {
        const maps = await Map.findAll({
            where: {
                userId: ctx.user.id
            },
            attributes: [
                'id',
                'name',
                'description',
                'width',
                'height',
                'startPoint',
                'endPoint',
                'obstacles',
                'dividColor',
                'minThreshold',
                'createdAt',
                'updatedAt'
            ],
            order: [['createdAt', 'DESC']]
        });
        ctx.status = 200;
        ctx.body = maps;
    } catch (error) {
        ctx.status = 500;
        ctx.body = { message: 'Error fetching maps', error };
    }
};

// Read a single map by ID
const getMapById = async (ctx) => {
    try {
        const { id } = ctx.params;
        const map = await Map.findByPk(id);
        if (!map) {
            ctx.status = 404;
            ctx.body = { message: 'Map not found' };
            return;
        }
        ctx.status = 200;
        ctx.body = map;
    } catch (error) {
        ctx.status = 500;
        ctx.body = { message: 'Error fetching map', error };
    }
};

// Update a map by ID
const updateMap = async (ctx) => {
    try {
        const { id } = ctx.params;
        const { name,description, width, height, startPoint, endPoint, obstacles,dividColor,minThreshold } = ctx.request.body;
        const map = await Map.findByPk(id);
        if (!map) {
            ctx.status = 404;
            ctx.body = { message: 'Map not found' };
            return;
        }
        await map.update({ name,description, width, height, startPoint, endPoint, obstacles,dividColor,minThreshold });
        ctx.status = 200;
        ctx.body = map;
    } catch (error) {
        ctx.status = 500;
        ctx.body = { message: 'Error updating map', error };
    }
};

// Delete a map by ID
const deleteMap = async (ctx) => {
    try {
        const { id } = ctx.params;
        const map = await Map.findByPk(id);
        if (!map) {
            ctx.status = 404;
            ctx.body = { message: 'Map not found' };
            return;
        }
        await map.destroy();
        ctx.status = 204;
    } catch (error) {
        ctx.status = 500;
        ctx.body = { message: 'Error deleting map', error };
    }
};

module.exports = {
    createMap,
    getAllMaps,
    getMapById,
    updateMap,
    deleteMap,
};