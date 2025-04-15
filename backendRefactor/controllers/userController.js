const User = require('../model/userModel');


const createUser = async (ctx) => {
    try {
        const { name, email, password } = ctx.request.body;
        const newUser = await User.create({ name, email, password });

        // Return user data without password
        const userData = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        };

        ctx.body = userData;
        ctx.status = 201;
    } catch (error) {
        ctx.status = 400;
        ctx.body = { error: error.message };
    }
}


const getUsers = async (ctx) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email']
        });

        ctx.body = users
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: error.message };
    }
}


const getUserById = async (ctx) => {
    try {
        const id = parseInt(ctx.params.id, 10);
        const user = await User.findByPk(id, {
            attributes: ['id', 'name', 'email'] // Exclude password
        });

        if (user) {
            ctx.body = user;
        } else {
            ctx.status = 404;
            ctx.body = { error: 'User not found' };
        }
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: error.message };
    }
}


const updateUser = async (ctx) => {
    try {
        const id = parseInt(ctx.params.id, 10);
        const { name, email } = ctx.request.body;

        const [updated] = await User.update(
            { name, email },
            { where: { id } }
        );

        if (updated) {
            const updatedUser = await User.findByPk(id, {
                attributes: ['id', 'name', 'email']
            });
            ctx.body = updatedUser;
        } else {
            ctx.status = 404;
            ctx.body = { error: 'User not found' };
        }
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: error.message };
    }
}


const deleteUser = async (ctx) => {
    try {
        const id = parseInt(ctx.params.id, 10);
        const deleted = await User.destroy({ where: { id } });

        if (deleted) {
            ctx.status = 204; // No content
        } else {
            ctx.status = 404;
            ctx.body = { error: 'User not found' };
        }
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: error.message };
    }
}

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
};
