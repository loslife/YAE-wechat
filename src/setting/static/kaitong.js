YLSMainModule.controller('kaitongController', function($scope){

    $scope.ktState = kaitong_model.state;
    $scope.checklist = JSON.parse(kaitong_model.checklist);

    $scope.kaitong = function(){

        $.get("/svc/weixin/kaitongCheck", function(data){

            if(data.code === 0) {
                alert("开通成功");
                $scope.ktState = 1;
                $scope.$digest();
            }else{
                alert(data.result.errorMessage);
            }
        });
    }

});


