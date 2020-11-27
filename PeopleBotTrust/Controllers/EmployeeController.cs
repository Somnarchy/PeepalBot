using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using PeopleBotTrust.Models;
using PeopleBotTrust.Services;

namespace PeopleBotTrust.Controllers
{
    public class EmployeeController : Controller
    {

        // declare
        public EmployeeService EmployeeService { get; set; }
       
        // declare & instantiate 
        // bad pratice, due to some sequentce of flow
        //public EmployeeService service = new EmployeeService();

        public EmployeeController()
        {
            //instantiate
            EmployeeService = new EmployeeService();            

        }
        // GET: Employee list
        public ActionResult Index()
        {
            var model = EmployeeService.GetList();
            return View(model);
        }

        // GET:Details of each employee

        public ActionResult Details(int id)
        {
            var model = EmployeeService.GetDetail(id);
            return View(model);
        }



        //Edit: Details of each employee


        public ActionResult Edit(int id)
        {
            var departmentService = new DepartmentService();
            //var CategoryService = new CategoryService();

            var model = EmployeeService.GetDetail(id);
            var departmentList = departmentService.GetDepartmentList();
            //var categoryList = CategoryService.GetCategoryList();
            model.DepartmentList = departmentList;
           // model.CategoryList = categoryList;

            return View(model);
            //return View("~/views/department/test.cshtml", model);
        }


        [HttpPost]
        public ActionResult Edit(EmployeeModel employee)
        {
          
            var detail = EmployeeService.GetDetail(employee.ID);

            if (detail == null)
            {
                throw new Exception("Invalid Page");
            }
            else
            {
                EmployeeService.Update(employee);
            }
            return RedirectToAction("Index", "Employee");
        }

        //[HttpPost]
        //public ActionResult Update(EmployeeModel e, FormCollection fc)
        //{
        //    var model = Service.GetDetail(e.ID);
        //    return View(model);
        //}




        //create the new employee


        [HttpGet]
        public ActionResult Create()
        {
            var departmentService = new DepartmentService();
            var departmentList = departmentService.GetDepartmentList();
            var model = new EmployeeModel();
            model.DepartmentList = departmentList;
            return View(model);
        }

       
        //Create 

        [HttpPost]
        public ActionResult Create(FormCollection fc)
        {

            var employee = new EmployeeModel()
            {
                FirstName = fc["FirstName"],
                LastName= fc["LastName"],
                Category = fc["Category"],
                Department = fc["Department"] != null ? Convert.ToInt32(fc["Department"]) : 0,
                Salary= Convert.ToDecimal(fc["Salary"]),
                IsActive = Convert.ToBoolean(fc["IsActive"])

            };
            EmployeeService.Create(employee);

            return RedirectToAction("index");
        }



        //GET: Employee/Delete/5
        public ActionResult Delete(int id)
        {
            var model = EmployeeService.GetDetail(id);
            return View(model);
        }

        //POST: Employee/Delete/5
        [HttpPost]
        public ActionResult Delete(int id, FormCollection collection)
        {
            try
            {
                EmployeeService.Delete(id);
            }
            catch
            {
                //return View();
            }
            return RedirectToAction("Index");
        }

    }
}