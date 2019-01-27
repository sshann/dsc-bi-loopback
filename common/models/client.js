'use strict';

var _ = require('underscore');

module.exports = function(Client) {
  // getRolesById was found in the gist https://gist.github.com/zhenyanghua/d24ea57cd70e69bcb82dc3bc8f14ea74
  Client.getRolesById = function(id, cb) {
    Client.getApp(function(err, app) {
      if (err) throw err;
      var RoleMapping = app.models.RoleMapping;
      var Role = app.models.Role;
      RoleMapping.find({where: {principalId: id}}, function(err, roleMappings) {
        if (!roleMappings.length) {
          return cb(null, {'roles': []});
        }
        var roleIds = _.uniq(roleMappings
          .map(function(roleMapping) {
            return roleMapping.roleId;
          }));
        var conditions = roleIds.map(function(roleId) {
          return {id: roleId};
        });

        Role.find({where: {or: conditions}}, function(err, roles) {
          if (err) throw err;
          var roleNames = roles.map(function(role) {
            return role.name;
          });
          cb(null, {'roles': roleNames});
        });
      });
    });
  };
  Client.remoteMethod('getRolesById', {
    http: {path: '/getRolesById', verb: 'get'},
    accepts: {arg: 'id', type: 'string'},
    returns: {arg: 'payload', type: 'Object'},
  });
};

