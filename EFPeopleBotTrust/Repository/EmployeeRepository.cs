using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EFPeopleBotTrust.Repository
{
    public class EmployeeRepository
    {
        private readonly peepalbot_dbEntities _context;
        public EmployeeRepository()
        {
            _context = new peepalbot_dbEntities();

        }

        public List<Employee> GetList()
        {
            return _context.Employees.ToList();
        }

        public Employee GetDetails(int id)
        {

            return _context.Employees.FirstOrDefault(x => x.Id == id);
        }

        public int Save(Employee model)
        {
            _context.Employees.Add(model);
            var insertedId = _context.SaveChanges();
            return insertedId;
        }

        public void Update(Employee model)
        {
            _context.Entry(model).State = System.Data.Entity.EntityState.Modified;
            _context.SaveChanges();
            //_context.Employees.Attach(model);
            //_context.SaveChanges();
        }


        public void Delete(int id)
        {
            var data = GetDetails(id);
            _context.Employees.Remove(data);
            // OR
            //_context.Entry(data).State = EntityState.Deleted;
            _context.SaveChanges();
        }
    }
}
