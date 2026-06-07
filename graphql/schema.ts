import gql from "graphql-tag";

export const typeDefs = gql`

    type User{
    id:ID!
    name:String!
    email:String!
    }

    type Student{
    id:ID!
    name:String!
    email:String!
    department:String!
    imageUrl:String
    }

    type Query{
    students:[Student]
    }

    type Mutation{

    register(
    name:String!
    email:String!
    password:String!
    ):String

    login(
    email:String!
    password:String!
    ):String

    addStudent(
    name:String!
    email:String!
    department:String!
    imageUrl:String
    ):Student

    updateStudent(
    id:ID!
    name:String
    email:String
    department:String
    imageUrl:String
    ):Student

    deleteStudent(
    id:ID!
    ):String
}
`;