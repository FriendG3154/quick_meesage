package service

import (
	authsvc "mdzf-jiajuguan/backend/internal/service/auth"
	damagereportsvc "mdzf-jiajuguan/backend/internal/service/damagereport"
	exceptiontradesvc "mdzf-jiajuguan/backend/internal/service/exceptiontrade"
	feedbacksvc "mdzf-jiajuguan/backend/internal/service/feedback"
	filesvc "mdzf-jiajuguan/backend/internal/service/file"
	inventorysvc "mdzf-jiajuguan/backend/internal/service/inventory"
	issuesvc "mdzf-jiajuguan/backend/internal/service/issue"
	metricsvc "mdzf-jiajuguan/backend/internal/service/metric"
	ordersvc "mdzf-jiajuguan/backend/internal/service/order"
	productsvc "mdzf-jiajuguan/backend/internal/service/product"
	refundsvc "mdzf-jiajuguan/backend/internal/service/refund"
	rolesvc "mdzf-jiajuguan/backend/internal/service/role"
	skusvc "mdzf-jiajuguan/backend/internal/service/sku"
	storesvc "mdzf-jiajuguan/backend/internal/service/store"
	suppliersvc "mdzf-jiajuguan/backend/internal/service/supplier"
	systemsvc "mdzf-jiajuguan/backend/internal/service/system"
	transfersvc "mdzf-jiajuguan/backend/internal/service/transfer"
	usersvc "mdzf-jiajuguan/backend/internal/service/user"
	warehousesvc "mdzf-jiajuguan/backend/internal/service/warehouse"
	wechatsvc "mdzf-jiajuguan/backend/internal/service/wechat"
	yzmsgsvc "mdzf-jiajuguan/backend/internal/service/yzmsg"

	"github.com/google/wire"
)

var WireSet = wire.NewSet(
	ordersvc.NewService,
	authsvc.NewService,
	productsvc.NewService,
	refundsvc.NewService,
	damagereportsvc.NewService,
	exceptiontradesvc.NewService,
	issuesvc.NewService,
	storesvc.NewService,
	skusvc.NewService,
	suppliersvc.NewService,
	transfersvc.NewService,
	wechatsvc.NewService,
	yzmsgsvc.NewService,
	filesvc.NewService,
	inventorysvc.NewService,
	metricsvc.NewService,
	rolesvc.NewService,
	systemsvc.NewService,
	usersvc.NewService,
	warehousesvc.NewService,
	feedbacksvc.NewService,
)
