const User = require('../model/userModel');
const bcrypt = require('bcrypt'); // 用于密码加密

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
        const { name, email,avatar,bio,address,field,gender,birthday } = ctx.request.body;

        const [updated] = await User.update(
            { name, email,avatar,bio,address,field,gender,birthday},
            { where: { id } }
        );

        if (updated) {
            const updatedUser = await User.findByPk(id, {
                //除去密码
                attributes: ['id', 'name', 'email','avatar','bio','address','field','gender','birthday'],
            });
            ctx.status = 200;
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

/**
 * @description 注销用户
 * @param {*} ctx 
 */
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
/**
 * 
 * @param {*} ctx 
 * @description 更新密码
 */
const updatePassword = async (ctx) => {
    try {
        const { password,oldPassword,id:uid } = ctx.request.body;
        console.log(ctx.request.body);
        const id = parseInt(uid, 10);
        // 查找用户
        const user = await User.findByPk(id);
        if (!user) {
            ctx.status = 404;
            ctx.body = { error: '用户不存在' };
            return;
        }
        // 验证旧密码
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            ctx.status = 400;
            ctx.body = { error: '旧密码错误' };
            return;
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        const [updated] = await User.update(
            { password: hashedPassword },
            { where: { id } }
        );

        if (updated) {
            ctx.status = 200;
            ctx.body = { message: '密码修改成功' };
        } else {
            ctx.status = 404;
            ctx.body = { error: '用户不存在' };
        }
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: error.message };
    }
};

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    updatePassword
};
