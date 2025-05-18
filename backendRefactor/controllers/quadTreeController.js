/**
 * 
 * @param {*} ctx
 * @param {ctx.request.body.id} id 地图ID
 */
const createQuadTree = async (ctx) => {
    ctx.body = {
        message: 'QuadTree created successfully',
        data: ctx.request.body.id
    };
}



module.exports = {
    createQuadTree
}