using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EFPeepalbot.Repository
{
    public class DepartmentRepository
    {
        private readonly PeepalbotEntities _context;
        public DepartmentRepository()
        {
            _context = new PeepalbotEntities();

        }
        public List<Department> GetList()
        {
            return _context.Departments.ToList();
        }

        public Department GetDetails(int id)
        {

            return _context.Departments.FirstOrDefault(x => x.Id == id);
        }

        public int Save(Department model)
        {
            _context.Departments.Add(model);
           _context.SaveChanges();
            return model.Id;
        }

        public void Update(Department model)
        {
            _context.Entry(model).State = System.Data.Entity.EntityState.Modified;
            _context.SaveChanges();
        }


        public void Delete(int id)
        {
            var data = GetDetails(id);
            _context.Departments.Remove(data);
            _context.SaveChanges();
        }
    }

}
