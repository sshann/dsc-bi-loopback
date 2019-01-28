'use strict';

var _ = require('underscore');

module.exports = function(Client) {
  // getRolesById was found in the gist https://gist.github.com/zhenyanghua/d24ea57cd70e69bcb82dc3bc8f14ea74
  // Timeouts are added due the quota limit in the database
  Client.getRolesById = function(id, cb) {
    Client.getApp(function(err, app) {
      if (err) throw err;
      var RoleMapping = app.models.RoleMapping;
      var Role = app.models.Role;
      var conditions;

      setTimeout(getRoleMapping, 1000);

      function getRoleMapping() {
        const RMfilter = {where: {principalId: id}};
        RoleMapping.find(RMfilter, function(err, roleMappings) {
          if (!roleMappings.length) {
            return cb(null, {'roles': []});
          }
          var roleIds = _.uniq(roleMappings
            .map(function(roleMapping) {
              return roleMapping.roleId;
            }));
          conditions = roleIds.map(function(roleId) {
            return {id: roleId};
          });

          setTimeout(getRoles, 1000);
        });
      }

      function getRoles() {
        const roleFilter = {where: {or: conditions}};
        Role.find(roleFilter, function(err, roles) {
          if (err) throw err;
          var roleNames = roles.map(function(role) {
            return role.name;
          });
          cb(null, {'roles': roleNames});
        });
      }
    });
  };
  Client.remoteMethod('getRolesById', {
    http: {path: '/getRolesById', verb: 'get'},
    accepts: {arg: 'id', type: 'string'},
    returns: {arg: 'payload', type: 'Object'},
  });
};

