using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeopleBotTrust.Models
{
    public class EmployeeModel
    {
        public int ID { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }

        // Has a property
        public int Department { get; set; }
        public string Category { get; set; }
        public decimal Salary { get; set; }
        public string Title { get; set; }
        public bool IsActive { get; set; }

        public string DepartmentName { get; set; }
        //public decimal NetAmount
        //{
        //    get
        //    {
        //        return (decimal)(Salary * .05);
        //    }

        //}

        //extra variable
        public List<DepartmentModel> DepartmentList { get; set; }
        //extra variable
        //public List<CategoryModel>  CategoryList{ get; set; }

    }
}