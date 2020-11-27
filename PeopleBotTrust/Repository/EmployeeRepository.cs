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
    public class EmployeeRepository
    {

        public EmployeeRepository()
        {

        }

        public List<EmployeeModel> GetList()
        {
            var list = new List<EmployeeModel>();
            var queryString = "select e.*, d.Name as DepartmentName  from Employee as e "
                +" join Department as d on e.Department = d.Id;";
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


                foreach (DataRow row in dataTable.Rows)
                {
                    list.Add(new EmployeeModel()
                    {
                        ID = (int)row["Id"],
                        Category =row["Category"].ToString(),
                        Department = (int)row["Department"],
                        DepartmentName = row["DepartmentName"].ToString(),
                        Salary = (decimal)row["Salary"],
                        Title = row["Title"]?.ToString(),
                        FirstName = row["FirstName"]?.ToString(),
                        LastName = row["LastName"]?.ToString(),
                    });
                }
                connection.Close();
            }
            return list;
        }


        public EmployeeModel GetDetail(int id)
        {

            EmployeeModel employee = null;
            using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
            {
                var queryString = "Select * from Employee where id =@ID";
                // Create the Command and Parameter objects.

                SqlCommand command = new SqlCommand(queryString, connection);
                command.Parameters.AddWithValue("@ID", id);

                // Open the connection in a try/catch block.
                // Create and execute the DataReader, writing the result
                // set to the console window.

                connection.Open();

                SqlDataAdapter da = new SqlDataAdapter(command);
                var dataTable = new DataTable();
                // this will query your database and return the result to your datatable
                da.Fill(dataTable);
                da.Dispose();


                foreach (DataRow row in dataTable.Rows)

                {
                    employee = new EmployeeModel()
                    {
                        ID = (int)row["Id"],
                        Category = row["Category"].ToString(),
                        Department = (int)row["Department"],
                        Salary = (decimal)row["Salary"],
                        Title = row["Title"]?.ToString(),
                        FirstName = row["FirstName"]?.ToString(),
                        LastName = row["LastName"]?.ToString(),
                    };
                }
                connection.Close();
            }
             return employee;
        }


        public int Save(EmployeeModel model)
        {

            using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
            {
                var queryString = "insert into employee values('" + model.FirstName + "', '" + model.LastName + "', '" + model.Department + "', '" + model.Category + "', '" + model.Salary + "', '" + model.Title + "', '" + model.IsActive + "')";

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


        public bool Update(EmployeeModel model)
        {
            using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
            {

                var queryString = "UPDATE employee SET FirstName = '" + model.FirstName + "',"
                    + "LastName = '" + model.LastName + "',"
                    + "Category = '" + model.Category + "',"
                    + "Department = '" + model.Department + "',"
                    + "Salary = '" + model.Salary + "',"
                    + "Title = '" + model.Title + "',"
                    + "isActive = '" + model.IsActive + "' "
                    + "WHERE id = '" + model.ID + "' ";

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

        //Delete employee 

        public bool Delete(int id)
        {
            using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
            {
                var queryString = "Delete from employee where id ='" + id + "'";
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