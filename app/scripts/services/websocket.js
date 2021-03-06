'use strict';

angular.module('app.websocket', ['ui.notify'])
  .provider('webSocket', function () {

    var webSocketURL;
    var webSocketObject; // for testing only

    return {
      $get: function ($q,  $rootScope, notificationService) {
        if (!webSocketURL && !webSocketObject) {
          throw 'WebSocket URL is not defined';
        }

        var socket = !webSocketObject ? new WebSocket(webSocketURL) : webSocketObject;

        var deferred = $q.defer();

        socket.onopen = function () {
          deferred.resolve();
          $rootScope.$apply();

          notificationService.notify({
            title: 'WebSocket',
            text: 'WebSocket connection established.',
            type: 'success',
            delay: 2000,
            icon: false,
            history: false
          });
        };

        var webSocketError = false;

        socket.onclose = function () {
          if (!webSocketError) {
            notificationService.notify({
              title: 'WebSocket Closed',
              text: 'WebSocket connection has been closed. Try refreshing the page.',
              type: 'error',
              icon: false,
              hide: false,
              history: false
            });
          }
        };

        //TODO
        socket.onerror = function () {
          webSocketError = true;
          notificationService.notify({
            title: 'WebSocket Error',
            text: 'WebSocket error. Try refreshing the page.',
            type: 'error',
            icon: false,
            hide: false,
            history: false
          });
        };

        var topicMap = {}; // topic -> [callbacks] mapping

        socket.onmessage = function (event) {
          var message = JSON.parse(event.data);

          var topic = message.topic;

          if (topicMap.hasOwnProperty(topic)) {
            topicMap[topic].fire(message.data);
          }
        };

        return {
          send: function (message) {
            var msg = JSON.stringify(message);

            deferred.promise.then(function () {
              console.log('send ' + msg);
              socket.send(msg);
            });
          },

          subscribe: function (topic, callback, $scope) {
            var callbacks = topicMap[topic];

            if (!callbacks) {
              var message = { type: 'subscribe', topic: topic }; // subscribe message
              this.send(message);

              callbacks = jQuery.Callbacks();
              topicMap[topic] = callbacks;
            }

            callbacks.add(callback);

            if ($scope) {
              $scope.$on('$destroy', function () {
                this.unsubscribe(topic, callback);
              }.bind(this));
            }
          },

          unsubscribe: function (topic, callback) {
            if (topicMap.hasOwnProperty(topic)) {
              var callbacks = topicMap[topic];
              callbacks.remove(callback); //TODO remove topic from topicMap if callbacks is empty
            }
          }
        };
      },

      setWebSocketURL: function (wsURL) {
        webSocketURL = wsURL;
      },

      setWebSocketObject: function (wsObject) {
        webSocketObject = wsObject;
      }
    };
  });
