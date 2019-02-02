'use strict';

var _ = require('underscore');

module.exports = function(Client) {
  // getRolesById was found in the gist https://gist.github.com/zhenyanghua/d24ea57cd70e69bcb82dc3bc8f14ea74
  // Timeouts are added due the quota limit in the database
  Client.roles = function(id, cb) {
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

  Client.remoteMethod('roles', {
    http: {path: '/roles', verb: 'get'},
    accepts: {arg: 'id', type: 'string'},
    returns: {arg: 'payload', type: 'Object'},
  });

  Client.observe('after save', function(ctx, next) {
    // console.log('ctx', ctx);

    Client.getApp(function(err, app) {
      let roleId;

      // console.log('===========');
      if (ctx.instance.role) {
        app.models.Role.find((err, roles) => {
          // console.log('roles', roles);
          roles.forEach(role => {
            if (ctx.instance.role === role.name) {
              roleId = role.id;
            }
          });
          ctx.instance.text = 'AAA';
          if (roleId) {
            const newRoleMapping = {
              'principalType': 'USER',
              'principalId': ctx.instance.id,
              'roleId': roleId,
            };
            app.models.RoleMapping.create(newRoleMapping, (err, mapping) => {
              // console.log(err, mapping);
              next();
            });
          }
        });
      }
      // if (ctx.instance) {
      //   console.log('Saved %s#%s', ctx.Model.modelName, ctx.instance.id);
      // } else {
      //   console.log('Updated %s matching %j',
      //     ctx.Model.pluralModelName,
      //     ctx.where);
      // }
    });
  });
};

// Update ACL is not working.
// {
//   "accessType": "EXECUTE",
//   "principalType": "ROLE",
//   "principalId": "business_owner",
//   "permission": "ALLOW",
//   "property": "create"
// },
// {
//   "accessType": "EXECUTE",
//   "principalType": "ROLE",
//   "principalId": "business_owner",
//   "permission": "ALLOW",
//   "property": "deleteById"
// },
// {
//   "accessType": "EXECUTE",
//   "principalType": "ROLE",
//   "principalId": "business_owner",
//   "permission": "ALLOW",
//   "property": "updateAttributes"
// },
// {
//   "accessType": "EXECUTE",
//   "principalType": "ROLE",
//   "principalId": "business_owner",
//   "permission": "ALLOW",
//   "property": "upsert"
// },
// {
//   "accessType": "EXECUTE",
//   "principalType": "ROLE",
//   "principalId": "business_owner",
//   "permission": "ALLOW",
//   "property": "find"
// }
