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
	public class DepartmentRepository

	{
		//Declare 
		public DepartmentRepository()
		{

		}

		// Get the list of Department
		public List<DepartmentModel> GetList()
		{
			var list = new List<DepartmentModel>();
			var queryString = "Select * from Department";
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
					list.Add(new DepartmentModel()
					{
						Id = (int)row["Id"],
						Name = row["Name"]?.ToString(),
						Description = row["Description"].ToString(),
					});
				}
			}
			return list;
		}

		//GEt Details of Department
		public DepartmentModel GetDetail(int id)
		{
			DepartmentModel department = null;
			var queryString = "Select * from department where id = @ID";
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
					department = new DepartmentModel
					{
						Id = (int)row["Id"],
						Name = row["Name"]?.ToString(),
						Description = row["Description"].ToString(),
					};
				}
			}
			return department;
		}

		// Save the department
		public int Save(DepartmentModel model)
		{
			using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
			{
				var queryString = "insert into department values('" + model.Name + "', '" + model.Description +"')";

				// Create the Command and Parameter objects.
				SqlCommand command = new SqlCommand(queryString, connection);
				//command.Parameters.AddWithValue("@ID",id);

				// Open the connection in a try/catch block.
				// Create and execute the DataReader, writing the result
				// set to the console window.

				connection.Open();
				var result = command.ExecuteNonQuery();
				return result;
			}
		}

		//UPDATE Customers SET ContactName = 'Alfred Schmidt', City = 'Frankfurt' WHERE CustomerID = 1;

		public bool Update(DepartmentModel model)
		{

			using (SqlConnection connection = new SqlConnection(DBConnection.connectionString))
			{
				var queryString = "UPDATE department SET Name = '" + model.Name
					+ "', Description = '" + model.Description + "' WHERE id = '" + model.Id + "' ";


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
				var queryString = "Delete from Department where id ='" + id + "'";
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




