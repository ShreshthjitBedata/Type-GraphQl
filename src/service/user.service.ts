import { ApolloError } from "apollo-server-errors";
import bcrypt from "bcrypt";
import {
  CreateUserInput,
  InputDeleteUser,
  LoginInput,
  UserModel,
} from "../schema/user.schema";
import Context from "../types/context";
import { signJwt } from "../utils/jwt";

class UserService {
  async createUser(input: CreateUserInput) {
    return UserModel.create(input);
  }

  async login(input: LoginInput, context: Context) {
    const e = "Invalid email or password";

    // Get our user by email
    const user = await UserModel.find().findByEmail(input.email).lean();

    if (!user) {
      throw new ApolloError(e);
    }

    // validate the password
    const passwordIsValid = await bcrypt.compare(input.password, user.password);

    if (!passwordIsValid) {
      throw new ApolloError(e);
    }

    // sign a jwt
    const token = signJwt(user);

    // set a cookie for the jwt
    context.res.cookie("accessToken", token, {
      maxAge: 3.154e10, // 1 year
      httpOnly: true,
      domain: "localhost",
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    // return the jwt
    return token;
  }

  async deleteUser(input: InputDeleteUser) {
    const e = "There is no user with this id";
    //console.log(input);
    const user = await UserModel.findById(input.id).lean();
    console.log(user?._id +"     "+ input.id);
    if (!user || (user._id!= input.id)) {
      throw new ApolloError(e);
    }
    return await UserModel.deleteOne(user);
   
  }
}

export default UserService;
