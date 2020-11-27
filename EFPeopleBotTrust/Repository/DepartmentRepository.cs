using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EFPeopleBotTrust.Repository
{
    public class DepartmentRepository
    {
        private readonly peepalbot_dbEntities _context;
        public DepartmentRepository()
        {
            _context = new peepalbot_dbEntities();

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
            var insertedId = _context.SaveChanges();
            return insertedId;
        }

        public void Update(Department model)
        {
            _context.Entry(model).State = System.Data.Entity.EntityState.Modified;
            _context.SaveChanges();
            //_context.Departments.Attach(model);
            //_context.SaveChanges();
        }


        public void Delete(int id)
        {
            var data = GetDetails(id);
            _context.Departments.Remove(data);
            // OR
            //_context.Entry(data).State = EntityState.Deleted;
            _context.SaveChanges();
        }
    }

}
