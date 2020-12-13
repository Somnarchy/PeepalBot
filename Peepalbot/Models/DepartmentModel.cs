using EFPeepalbot;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Peepalbot.Models
{
    public class DepartmentModel 
    {
        public Department Department { get; set; }

        public List<Department> DepartmentList { get; set; }
        //public int Id { get; set; }

        //[Display(Name = "Department Name")]
        //[Required(ErrorMessage ="should not be null")]
        //[MaxLength(length: 50)]
        //public string Name { get; set; }

        //public string Description { get; set; }


    }
    
}