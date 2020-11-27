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
    public class CategoryRepository
    {
        public CategoryRepository()
        {

        }
        public List<CategoryModel> GetList()
        {
            var list = new List<CategoryModel>();
            var queryString = "Select * from Category";
            using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
            {
                // Create the Command and Parameter objects.
                SqlCommand command = new SqlCommand(queryString, connection);
                //command.Parameters.AddWithValue("@pricePoint", paramValue);

                // Open the connection in a try/catch block.
                // Create and execute the DataReader, writing the result
                // set to the console window.

                connection.Open();

                SqlDataAdapter da = new SqlDataAdapter(command);
                var dataTable = new DataTable();
                // this will query your database and return the result to your datatable
                da.Fill(dataTable);
                da.Dispose();

                connection.Close();

                foreach (DataRow row in dataTable.Rows)
                {
                    list.Add(new CategoryModel()
                    {
                        Id = (int)row["Id"],
                        Type = row["Type"]?.ToString(),
                    });
                }
            }
            return list;
        }

        //Get Category

        public CategoryModel GetDetails(int id)
        {
            CategoryModel category = null;

            var queryString = "Select * from category where id = @ID";
            using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
            {
                // Create the Command and Parameter objects.
                SqlCommand command = new SqlCommand(queryString, connection);
                command.Parameters.AddWithValue("@ID", id);
                // Open the connection in a try/catch block.
                // Create and execute the DataReader, writing the result
                // set to the console window.

                SqlDataAdapter da = new SqlDataAdapter(command);
                var dataTable = new DataTable();
                // this will query your database and return the result to your datatable
                da.Fill(dataTable);
                da.Dispose();
                connection.Close();
                foreach (DataRow row in dataTable.Rows)
                {
                    category = new CategoryModel
                    {
                        Id = (int)row["Id"],
                        Type = row["Type"]?.ToString()
                    };
                }
                return category;

            }


        }


        public int Save(CategoryModel model)
        {

            using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
            {
                var queryString = "insert into Category values('"+model.Type+"')";

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


        public bool Update(CategoryModel model)
        {

            using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
            {
                var queryString = "UPDATE Category SET Name = '" + model.Type
                    + "' WHERE id = '" + model.Id + "' ";


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
                var queryString = "Delete from Category where id ='" + id + "'";
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