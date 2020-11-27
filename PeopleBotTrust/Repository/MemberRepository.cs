using PeopleBotTrust.DAL;
using PeopleBotTrust.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;

namespace PeopleBotTrust.Repository
{
    public class MemberRepository
    {

        public MemberRepository()
        {

        }

        public List<MemberModel> GetList()
        {
            var memberList = new List<MemberModel>();
            var queryString = "Select * from member";
            using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
            {
                // Create the Command and Parameter objects.
                SqlCommand command = new SqlCommand(queryString, connection);
                //command.Parameters.AddWithValue("@pricePoint", paramValue);

                // Open the connection in a try/catch block.
                // Create and execute the DataReader, writing the result
                // set to the console window.
               
                connection.Open();
            //    SqlDataReader reader = command.ExecuteReader();
            //    while (reader.Read())
            //    {
            //        memberList.Add(new MemberModel()
            //        {
            //            Id = (int)reader[0],
            //            FirstName = reader[1].ToString(),
            //            LastName = reader[2]?.ToString(),
            //            Address = reader[3]?.ToString(),
            //            MyPhone = reader[4]?.ToString(),
            //            Email = reader[5]?.ToString(),
            //            Info = reader[6]?.ToString(),
            //            //DOB = reader[7] != null ? (DateTime?)reader[7] : null,
            //        });
            //    }
            //    reader.Close();               
                
            //}
            //return memberList;

             SqlDataAdapter da = new SqlDataAdapter(command);
                var dataTable = new DataTable();
                // this will query your database and return the result to your datatable
                da.Fill(dataTable);
                da.Dispose();

                foreach (DataRow row in dataTable.Rows)
                {
                    memberList.Add(new MemberModel()
                    {
                        Id = (int)row["Id"],
                        FirstName = row["FirstName"]?.ToString(),
                        LastName = row["LastName"]?.ToString(),
                        Address = row["Address"]?.ToString(),
                        MyPhone = row["Phone"]?.ToString(),
                        Email = row["Email"]?.ToString(),
                        Info = row["Info"]?.ToString(),

                    });
                }
                connection.Close();
            }
            return memberList;
        }

        public MemberModel GetDetail(int id)
        {
            MemberModel member = null;
            var queryString = "Select * from member where id = @ID";
            using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
            {
                // Create the Command and Parameter objects.
                SqlCommand command = new SqlCommand(queryString, connection);
                command.Parameters.AddWithValue("@ID", id);

                // Open the connection in a try/catch block.
                // Create and execute the DataReader, writing the result
                // set to the console window.
                
                connection.Open();
                SqlDataReader reader = command.ExecuteReader();
                while (reader.Read())
                {
                    member = new MemberModel()
                    {
                        Id = (int)reader[0],
                        FirstName = reader[1].ToString(),
                        LastName = reader[2]?.ToString(),
                        Address = reader[3]?.ToString(),
                        MyPhone = reader[4]?.ToString(),
                        Email = reader[5]?.ToString(),
                        Info = reader[6]?.ToString(),
                       // DOB = reader[7] != null ? (DateTime?)reader[7] : null,
                    };
                }
                reader.Close();
               

            }
            return member;
        }


        public int Save(MemberModel model)
        {

            using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
            {
                var queryString = "insert into member values('" + model.FirstName + "', '" + model.LastName + "', '"  + model.Address + "', '" + model.MyPhone + "', '" + model.Email + "', '" + model.Info + "', '" + model.DOB + "')";

                // Create the Command and Parameter objects.
                SqlCommand command = new SqlCommand(queryString, connection);
                //command.Parameters.AddWithValue("@pricePoint", paramValue);

                // Open the connection in a try/catch block.
                // Create and execute the DataReader, writing the result
                // set to the console window.
                
                    connection.Open();
                    var result = command.ExecuteNonQuery();
                    return result;
              
            }

        }

        public int Save(string ffirstName, string llLastname, string aadress)
        {

            using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
            {
                var queryString = "insert into member (FirstName, LastName, Address) values('" + ffirstName + "', '" + llLastname + "', '" + aadress + "')";

                // Create the Command and Parameter objects.
                SqlCommand command = new SqlCommand(queryString, connection);
                //command.Parameters.AddWithValue("@pricePoint", paramValue);

                // Open the connection in a try/catch block.
                // Create and execute the DataReader, writing the result
                // set to the console window.

                connection.Open();
                var result = command.ExecuteNonQuery();
                return result;

            }

        }


        //UPDATE Customers SET ContactName = 'Alfred Schmidt', City = 'Frankfurt' WHERE CustomerID = 1;


        public bool Update(MemberModel model)
        {

            using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
            {
                var queryString = "UPDATE member SET FirstName = '" + model.FirstName 
                    + "', LastName = '" + model.LastName
                    + "', Address = '" + model.Address 
                    + "', Phone = '" + model.MyPhone 
                    + "', Email = '" + model.Email 
                    + "', Info = '" + model.Info 
                    + "', DOB = '" + model.DOB + "' WHERE id = '" + model.Id + "' ";

                // Create the Command and Parameter objects.
                SqlCommand command = new SqlCommand(queryString, connection);
                //command.Parameters.AddWithValue("@pricePoint", paramValue);

                // Open the connection in a try/catch block.
                // Create and execute the DataReader, writing the result
                // set to the console window.
              
                connection.Open();
                var result = command.ExecuteNonQuery();
                return result >= 0 ? true : false;

            }

        }

        public bool Delete(int id)
        {
            using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
            {
                var queryString = "Delete from member where id ='" + id + "'";
                // Create the Command and Parameter objects.
                SqlCommand command = new SqlCommand(queryString, connection);
                //command.Parameters.AddWithValue("@pricePoint", paramValue);

                // Open the connection in a try/catch block.
                // Create and execute the DataReader, writing the result
                // set to the console window.

                connection.Open();
                var result = command.ExecuteNonQuery();
                return result >= 0 ? true : false;
            }
        }
    }


}