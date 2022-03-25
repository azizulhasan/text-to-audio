<?php
// Tab Title array
$tab_array = array(

	array(
		'title'=>'Forms',
		'icon' => 'paperclip'
	),
	array(
		'title'=>'Buttons',
		'icon' => 'link'
	),
    array(
        'title'=>'Button Group',
        'icon' => 'grid'
    ),
	array(
		'title'=>'Cards',
		'icon' => 'move'
	),
	array(
		'title'=>'Tables',
		'icon' => 'sidebar'
	),
	array(
		'title'=>'Dropdowns',
		'icon' => 'chevrons-down'
	),
	array(
		'title'=>'Modal',
		'icon' => 'minimize'
	),
	array(
		'title'=>'Tooltip',
		'icon' => 'message-square'
	),
	array(
		'title'=>'Spinners',
		'icon' => 'loader'
	),
	array(
		'title'=>'Progress',
		'icon' => 'percent'
	),
	array(
		'title'=>'Alert',
		'icon' => 'alert-triangle'
	),
	array(
		'title'=>'Icon',
		'icon' => 'feather'
	),
	array(
		'title'=>'Typography',
		'icon' => 'type'
	),
    array(
        'title'=>'Breadcrumb',
        'icon' => 'chevron-right'
    ),
);
?>
<div class="webappick-wrap">
	<div class="webappick-dashboard-header">
		<!-- Brand -->
		<a href="https://webappick.com"><img src="<?php echo plugin_dir_url( __FILE__ ) .'../images/webappick-logo.svg'; ?>" alt="WEBAPPICK"></a>
	</div>
	<div class="webappick-dashboard-body">
		<div class="webappick-row">

			<!-- START WEBAPPICK SIDEBAR NAV AREA -->

			<div class="webappick-col-xl-2 webappick-col-lg-4 webappick-col-md-4 webappick-col-sm-12 webappick-col-12 webappick-pr-0">
				<div class="webappick-dashboard-sidebar">
                    <nav class="webappick-navbar webappick-navbar-vertical webappick-fixed-left webappick-navbar-expand-md webappick-navbar-light" id="sidebar">
                        <div class="webappick-container-fluid">

                            <!-- Toggler -->
                            <button class="webappick-navbar-toggler" type="button" data-toggle="collapse" data-target="#sidebarCollapse" aria-controls="sidebarCollapse" aria-expanded="false" aria-label="Toggle navigation">
                                <span class="webappick-navbar-toggler-icon"></span>
                            </button>

                            <!-- User (xs) -->
                            <div class="webappick-navbar-user webappick-d-md-none">

                                <!-- Dropdown -->
                                <div class="webappick-dropdown">

                                    <!-- Toggle -->
                                    <a href="#" id="sidebarIcon" class="webappick-dropdown-toggle" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        <div class="avatar avatar-sm avatar-online">
                                            <img src="<?php echo plugin_dir_url( __FILE__ ) .'../images/webappick-logo.svg'; ?>" class="avatar-img rounded-circle" alt="...">
                                        </div>
                                    </a>

                                </div>

                            </div>

                            <!-- Collapse -->
                            <div class="webappick-collapse webappick-navbar-collapse" id="sidebarCollapse">


                                <!-- Navigation -->
                                <ul class="webappick-navbar-nav webappick-mb-md-4">

                                    <li class="webappick-nav-item">
                                        <a href="#forms " class="webappick-nav-link" data-toggle="tab " aria-controls="forms "><i class="fe fe-paperclip "></i>Forms </a>
                                    </li>
                                    <li class="webappick-nav-item">
                                        <a href="#buttons " class="webappick-nav-link" data-toggle="tab " aria-controls="buttons "><i class="fe fe-link "></i>Buttons </a>
                                    </li>
                                    <li class="webappick-nav-item ">
                                        <a href="#button-group " class="webappick-nav-link" data-toggle="tab " aria-controls="button-group "><i class="fe fe-grid "></i>Button Group </a>
                                    </li>
                                    <li class="webappick-nav-item">
                                        <a href="#cards " class="webappick-nav-link" data-toggle="tab " aria-controls="cards "><i class="fe fe-move "></i>Cards </a>
                                    </li>
                                    <li class="webappick-nav-item">
                                        <a href="#tables " class="webappick-nav-link" data-toggle="tab " aria-controls="tables "><i class="fe fe-sidebar "></i>Tables </a>
                                    </li>
                                    <li class="webappick-nav-item ">
                                        <a href="#dropdowns " class="webappick-nav-link" data-toggle="tab " aria-controls="dropdowns "><i class="fe fe-chevrons-down "></i>Dropdowns </a>
                                    </li>
                                    <li class="webappick-nav-item ">
                                        <a href="#modal " class="webappick-nav-link" data-toggle="tab " aria-controls="modal "><i class="fe fe-minimize "></i>Modal </a>
                                    </li>
                                    <li class="webappick-nav-item ">
                                        <a href="#tooltip " class="webappick-nav-link" data-toggle="tab " aria-controls="tooltip "><i class="fe fe-message-square "></i>Tooltip </a>
                                    </li>
                                    <li class="webappick-nav-item">
                                        <a href="#spinners " class="webappick-nav-link" data-toggle="tab " aria-controls="spinners "><i class="fe fe-loader "></i>Spinners </a>
                                    </li>
                                    <li class="webappick-nav-item">
                                        <a href="#progress " class="webappick-nav-link" data-toggle="tab " aria-controls="progress "><i class="fe fe-percent "></i>Progress </a>
                                    </li>
                                    <li class="webappick-nav-item">
                                        <a href="#alert " class="webappick-nav-link" data-toggle="tab " aria-controls="alert "><i class="fe fe-alert-triangle "></i>Alert </a>
                                    </li>
                                    <li class="webappick-nav-item ">
                                        <a href="#icon " class="webappick-nav-link" data-toggle="tab " aria-controls="icon "><i class="fe fe-feather "></i>Icon </a>
                                    </li>
                                    <li class="webappick-nav-item ">
                                        <a href="#typography " class="webappick-nav-link" data-toggle="tab " aria-controls="typography "><i class="fe fe-type "></i>Typography </a>
                                    </li><li class="webappick-nav-item ">
                                        <a href="#breadcrumb " class="webappick-nav-link" data-toggle="tab " aria-controls="breadcrumb "><i class="fe fe-chevron-right "></i>Breadcrumb </a>
                                    </li>
                                    <li class="webappick-nav-item">
                                        <a class="webappick-nav-link collapsed" href="#sidebarBasics" data-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarBasics">
                                            <i class="fe fe-clipboard"></i> Basics
                                        </a>
                                        <div class="collapse" id="sidebarBasics">
                                            <ul class="webappick-nav webappick-nav-sm webappick-flex-column">
                                                <li class="webappick-nav-item ">
                                                    <a href="getting-started.html" class="webappick-nav-link">
                                                        Getting Started
                                                    </a>
                                                </li>
                                                <li class="webappick-nav-item ">
                                                    <a href="design-file.html" class="webappick-nav-link">
                                                        Design File
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                    </li>
                                    <li class="webappick-nav-item">
                                        <a class="webappick-nav-link collapsed" href="#sidebarComponents" data-toggle="collapse" role="button" aria-expanded="false" aria-controls="sidebarComponents">
                                            <i class="fe fe-book-open"></i> Components
                                        </a>
                                        <div class="collapse" id="sidebarComponents" style="">
                                            <ul class="webappick-nav webappick-nav-sm webappick-flex-column">
                                                <li>
                                                    <a href="components.html#alerts" class="webappick-nav-link">
                                                        Alerts
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="components.html#autosize" class="webappick-nav-link">
                                                        Autosize
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="components.html#avatars" class="webappick-nav-link">
                                                        Avatars
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                    </li>
                                    <li class="webappick-nav-item">
                                        <a class="webappick-nav-link " href="changelog.html">
                                            <i class="fe fe-git-branch"></i> Changelog <span class="webappick-badge webappick-badge-primary webappick-ml-auto">v1.5.0</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <!-- / .navbar-collapse -->

                        </div>
                    </nav>
				</div><!-- end .webappick-dashboard-sidebar -->
			</div><!-- end .webappick-col-xl-2 -->

			<!-- END WEBAPPICK PLUGIN SIDEBAR NAV AREA -->


			<!-- START WEBAPPICK PLUGIN CONTENT AREA -->

			<div class="webappick-col-xl-10 webappick-col-lg-8 webappick-col-md-8 webappick-col-sm-12 webappick-col-12 webappick-pl-0">
				<div class="webappick-dashboard-content">
					<div class="webappick-tab-content">
						<?php foreach($tab_array as $key => $tab){
							$current_tab = $tab_array[0]['title'];
							$tab_id = strtolower($tab['title']);
                            $tab_link = str_replace(' ','-',$tab_id);
							$tab_class = ($tab['title']==$current_tab) ? 'active' : '' ;
							?>
							<div class="webappick-tab-pane <?php echo $tab_class; ?>" id="<?php echo $tab_link; ?>" role="tabpanel">
								<?php include_once("tabs/{$tab_link}.php"); ?>
							</div>
						<?php } ?>
					</div>
				</div><!-- end .webappick-dashboard-content -->
			</div><!-- end .webappick-col-xl-10 -->

			<!-- END WEBAPPICK PLUGIN CONTENT AREA -->

		</div><!-- webappick-row -->
	</div><!-- end .webappick-dashboard-body -->
</div><!-- end .webappick-wrap -->

<div class="modal fade" id="modalMembers" tabindex="-1" role="dialog" aria-hidden="true">
	<div class="modal-dialog modal-dialog-centered" role="document">
		<div class="modal-content">
			<div class="modal-card" data-toggle="lists" data-lists-values="[&quot;name&quot;]">
				<div class="webappick-card-header">
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">
						<span aria-hidden="true" style="font-size: 30px;text-align: right;display: block;">×</span>
					</button>
				</div>

				<div class="webappick-card-body">

					<p>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. </p>

				</div>
			</div>
		</div>
	</div>
</div>