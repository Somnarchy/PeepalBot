using PeopleBotTrust.Models;
using PeopleBotTrust.Repository;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PeopleBotTrust.Services
{
    public class DepartmentService
    {
        private List<DepartmentModel> DepartmentList { get; set; }
        private DepartmentRepository DepartmentRepository{ get; set; }
       
        public DepartmentService()
        {

            DepartmentRepository = new DepartmentRepository();
            //DepartmentList = new List<DepartmentModel> {
            //        new DepartmentModel {Id=1, Name="Engineering",Description="Subin Dongol"},
            //        new  DepartmentModel {Id=2, Name="Sales",Description="Surendra Maharjan"},
            //        new  DepartmentModel {Id=3, Name="Human Resource",Description="Ratna Maharjan"},
            //        new  DepartmentModel {Id=4, Name="Acccounting",Description="Gopi Maharjan"},
            //        new  DepartmentModel {Id=5, Name="Logistics",Description="Binod Maharjan"},
            //        new  DepartmentModel {Id=6, Name="Business Developement",Description="Suresh Maharjan"},
            //    };
        }

        public List<DepartmentModel> GetDepartmentList()
        {
            return DepartmentRepository.GetList();
        }


        public DepartmentModel GetDetail(int Id)
        {
            return DepartmentRepository.GetDetail(Id);
        }



        public int Create(DepartmentModel model)
        {
            return DepartmentRepository.Save(model);
        }


        public bool Update(DepartmentModel model)
        {
            return DepartmentRepository.Update(model);
        }

        public bool Delete(int id)
        {
            return DepartmentRepository.Delete(id);

        }

    }
}