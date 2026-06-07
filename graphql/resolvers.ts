import { prisma } from "@/lib/prisma";
import { generateToken, verifyToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const resolvers = {
  Query: {
    students: async (_: unknown, __: unknown, context: { token: string }) => {
      // check token before returning students
      verifyToken(context.token);
      return await prisma.student.findMany({ orderBy: { createdAt: "desc" } });
    },
  },

  Mutation: {
    register: async (_: unknown, args: { name: string; email: string; password: string }) => {
      const hashed = await bcrypt.hash(args.password, 10);
      const user = await prisma.user.create({
        data: { name: args.name, email: args.email, password: hashed },
      });
      return generateToken(user.id);
    },

    login: async (_: unknown, args: { email: string; password: string }) => {
      const user = await prisma.user.findUnique({ where: { email: args.email } });
      if (!user) throw new Error("User not found");
      const valid = await bcrypt.compare(args.password, user.password);
      if (!valid) throw new Error("Wrong password");
      return generateToken(user.id);
    },

    addStudent: async (
      _: unknown,
      args: { name: string; email: string; department: string; imageUrl?: string },
      context: { token: string }
    ) => {
      verifyToken(context.token);
      return await prisma.student.create({ data: args });
    },

    updateStudent: async (
      _: unknown,
      args: { id: string; name?: string; email?: string; department?: string; imageUrl?: string },
      context: { token: string }
    ) => {
      verifyToken(context.token);
      const { id, ...data } = args;
      return await prisma.student.update({ where: { id: Number(id) }, data });
    },

    deleteStudent: async (_: unknown, args: { id: string }, context: { token: string }) => {
      verifyToken(context.token);
      await prisma.student.delete({ where: { id: Number(args.id) } });
      return "Student deleted";
    },
  },
};
