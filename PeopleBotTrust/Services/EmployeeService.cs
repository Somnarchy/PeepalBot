using PeopleBotTrust.Models;
using PeopleBotTrust.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeopleBotTrust.Services
{

    public class EmployeeService
    {   // Declare
        private EmployeeRepository EmployeeRepository { get; set; }

        public EmployeeService()
        {  
          //Initialize 
           EmployeeRepository = new EmployeeRepository();
        }


        //GetList
        public List<EmployeeModel> GetList()
        {
            return EmployeeRepository.GetList();
        }

        //GetDetails
        public EmployeeModel GetDetail(int Id)
        {
            var details = EmployeeRepository.GetDetail(Id);
            return details;
        }

        // Update the employee details
        public void Update(EmployeeModel emp)
        {
            EmployeeRepository.Update(emp);
            
        }

        // Create new employee
        public int Create(EmployeeModel emp)
        {
            var id = EmployeeRepository.Save(emp);
            return id;

        }
        //public EmployeeModel getTotalSalary(int salary)
        //{
        //    var sum = EmployeeList.FirstOrDefault()
        //    return sum;
        //}


            //Delete the particular employee
        public void Delete(int id)
        {
            EmployeeRepository.Delete(id);
        }

    }
}