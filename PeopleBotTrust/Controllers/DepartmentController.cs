using PeopleBotTrust.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using PeopleBotTrust.Repository;
using PeopleBotTrust.Models;

namespace PeopleBotTrust.Controllers
{
    public class DepartmentController : Controller
    {
        // declare
        public DepartmentService DepartmentService { get; set; }

        public DepartmentController()
        {
            DepartmentService = new DepartmentService();
        }

        // GET: Department
        public ActionResult Index()
        {
            var model = DepartmentService.GetDepartmentList();
            return View(model);
        }

        // GET: Department/Details/5

        public ActionResult Detail(int Id)
        {
            var model = DepartmentService.GetDetail(Id);
            return View(model);
        }


        // GET: Department/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: Department/Save
        [HttpPost]

        public ActionResult Save(FormCollection collection)
        {
            try
            {
                // TODO: Add insert logic here

                var model = new DepartmentModel();

                model.Name = collection["Name"];
                model.Description = collection["Description"];
                DepartmentService.Create(model);

                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }

        }
        // GET: Department/Edit/5

        public ActionResult Edit(int id)
        {
            var model = DepartmentService.GetDetail(id);
            return View(model);
        }






        //POST: Department/Edit/5
        [HttpPost]
        public ActionResult Edit(int id, FormCollection collection)
        {
            try
            {
                //TODO: Add update logic here

                var model = new DepartmentModel();
                model.Id = id;
                model.Name = collection["Name"];
                model.Description = collection["Description"];
                DepartmentService.Update(model);

                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }

        //GET: Department/Delete/5
        public ActionResult Delete(int id)
        {
          var model =  DepartmentService.Delete(id);
          return View(model);
        }

        //POST: Department/Delete/5

        [HttpPost]
        public ActionResult Delete(int id, FormCollection collection)
        {
             DepartmentService.Delete(id);
          
            return RedirectToAction("Index");
        }
    }
}
