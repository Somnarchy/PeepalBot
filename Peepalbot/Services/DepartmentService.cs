using EFPeepalbot;
using EFPeepalbot.Repository;
using Peepalbot.Models;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Peepalbot.Services
{
    public class DepartmentService
    {
        private List<DepartmentModel> DepartmentList { get; set; }
        private DepartmentRepository _repository{ get; set; }
       
        public DepartmentService()
        {
           _repository = new DepartmentRepository();

        }

        public List<Department> GetDepartmentList()
        {
            return _repository.GetList();
        }


        public Department GetDetail(int Id)
        {
            return _repository.GetDetails(Id);
        }



        public int Create(Department department)
        {
            return _repository.Save(department);
        }


        public void Update(Department department)
        {
            _repository.Update(department);
        }

        public void Delete(int id)
        {
             _repository.Delete(id);

        }

    }
}