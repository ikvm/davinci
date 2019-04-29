import React from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { Row, Col, Tooltip, Button, Pagination, Input, Modal } from 'antd'
import ProjectItem from './ProjectItem'
import AntdFormType from 'antd/lib/form/Form'
import ProjectEditForm from './Project'
import AdminForm from './Transfer'
import ProjectForm from './ProjectForm'
import * as Organization from '../Organization'
import ComponentPermission from '../../Account/components/checkMemberPermission'
import { CREATE_ORGANIZATION_PROJECT } from '../../App/constants'
import { checkNameUniqueAction } from '../../App/actions'
import { IStarUser, IProject } from '../containers/Projects'
import { createStructuredSelector } from 'reselect'
import {
  loadOrganizationProjects,
  deleteOrganizationMember,
  changeOrganizationMemberRole,
  setCurrentProject
} from '../actions'
import {
  makeSelectOrganizations,
  makeSelectCurrentOrganizations,
  makeSelectCurrentOrganizationProjects,
  makeSelectCurrentOrganizationProjectsDetail,
  makeSelectCurrentOrganizationRole,
  makeSelectCurrentOrganizationMembers,
  makeSelectInviteMemberList
} from '../selectors'
import {
  addProject,
  editProject,
  deleteProject,
  getProjectStarUser,
  loadProjects,
  unStarProject,
  clickCollectProjects,
  loadCollectProjects,
  addProjectAdmin,
  deleteProjectAdmin
} from '../containers/Projects/actions'
import { makeSelectLoginUser } from '../../App/selectors'
const styles = require('../Organization.less')
import { makeSelectStarUserList, makeSelectCollectProjects } from '../containers/Projects/selectors'

interface IProjectsState {
 
  formType?: string
  formVisible: boolean
  modalLoading: boolean
  editFormVisible: boolean
  adminFormVisible: boolean
  pageNum: number
  pageSize: number
  currentProject: any
  organizationProjects: boolean | Organization.IOrganizationProjects[]
}

interface IProjectsProps {
  loginUser: any
  organizationId: number
  currentOrganization: Organization.IOrganization
  toProject: (id: number) => any
  deleteProject: (id: number) => any
  starUser: IStarUser[]
  collectProjects: IProject[]
  onAddProject: (project: any, resolve: () => any) => any
  onEditProject: (project: any, resolve: () => any) => any
  organizationProjects: Organization.IOrganizationProjects[]
  organizationProjectsDetail: {total?: number, list: Organization.IOrganizationProjects[]}
  unStar?: (id: number) => any
  userList?: (id: number) => any
  onCheckUniqueName: (pathname: any, data: any, resolve: () => any, reject: (error: string) => any) => any
  getOrganizationProjectsByPagination: (obj: {keyword?: string, pageNum: number, pageSize: number}) => any
  onLoadOrganizationProjects: (param: {id: number, pageNum?: number, pageSize?: number}) => any
  onClickCollectProjects: (formType, project: object, resolve: (id: number) => any) => any
  onLoadCollectProjects: () => any
  onSetCurrentProject: (option: any) => any
  starUserList: IStarUser[]
  onStarProject: (id: number, resolve: () => any) => any
  onDeleteProject: (id: number, resolve?: any) => any
  onGetProjectStarUser: (id: number) => any
  currentOrganizationProjects: Organization.IOrganizationProjects[]
  organizationMembers: any[]
}

export class ProjectList extends React.PureComponent<IProjectsProps, IProjectsState> {
  constructor (props) {
    super(props)
    this.state = {
      formType: '',
      formVisible: false,
      editFormVisible: false,
      adminFormVisible: false,
      modalLoading: false,
      pageNum: 1,
      pageSize: 10,
      organizationProjects: false,
      currentProject: null
    }
  }

  private ProjectForm: AntdFormType = null
  private ProjectEditForm: AntdFormType = null
  private refHandlers = {
    ProjectForm: (ref) => this.ProjectForm = ref,
    ProjectEditForm: (ref) => this.ProjectEditForm = ref
  }

  private showProjectForm = (type: string) => (e) => {
    e.stopPropagation()
    this.setState({
      formVisible: true,
      formType: type
    })
  }

  public componentWillMount () {
    const {
      onLoadOrganizationProjects,
      onLoadCollectProjects,
      organizationId
    } = this.props
    onLoadOrganizationProjects({id: Number(organizationId)})
    onLoadCollectProjects()
  }

  private showEditProjectForm = (formType, option) => (e) => {
    this.setState({
      formType,
      editFormVisible: true,
      currentProject: option
    }, () => {
      setTimeout(() => {
        this.props.onSetCurrentProject(option)
        const {orgId, id, name, pic, description, visibility} = option
        this.ProjectEditForm.props.form.setFieldsValue({
          orgId: `${orgId}`,
          id,
          name,
          pic,
          description,
          visibility: `${visibility}`
        })
      }, 0)
    })
  }
  private getOrganizationProjectsByPagination = (obj) => {
    const { onLoadOrganizationProjects, organizationId } = this.props
    this.setState({
      pageNum: obj.pageNum,
      pageSize: obj.pageSize
    })
    const param = {
      keyword: obj.keyword,
      id: organizationId,
      pageNum: obj.pageNum,
      pageSize: obj.pageSize
    }
    onLoadOrganizationProjects(param)
  }

  private onSearchProject = (event) => {
    const value = event.target.value

    const param = {
      keyword: value,
      pageNum: this.state.pageNum,
      pageSize: this.state.pageSize
    }
    this.getOrganizationProjectsByPagination(param)
  }

  private hideProjectForm = () => {
    this.setState({
      formVisible: false,
      editFormVisible: false,
      modalLoading: false
    })
  }




  private afterProjectFormClose = () => {
    this.ProjectForm.props.form.resetFields()
  }

  private afterProjectEditFormClose = () => {
    this.ProjectEditForm.props.form.resetFields()
  }

  private checkUniqueName = (rule, value = '', callback) => {
    const { onCheckUniqueName, organizationId } = this.props
    const { formVisible, editFormVisible } = this.state
    const { getFieldsValue } = formVisible ? this.ProjectForm.props.form : this.ProjectEditForm.props.form
    const id = getFieldsValue()['id']
    const data = {
      name: value,
      orgId: organizationId,
      id
    }

    onCheckUniqueName('project', data,
      () => {
        callback()
      }, (err) => {
        callback(err)
      })
  }

  private add = () => {
    console.log('add')
  }


  private onModalOk = () => {
    const { organizationId, currentOrganization, onAddProject, onEditProject, onLoadOrganizationProjects } = this.props
    const { formType } = this.state
    const targetForm = formType === 'edit' ? this.ProjectEditForm : this.ProjectForm
    targetForm.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        this.setState({ modalLoading: true })
        values.visibility = values.visibility === 'true' ? true : false

        if (formType === 'organizationProject') {
          onAddProject({
            ...values,
            ...{orgId: organizationId},
            pic: `${Math.ceil(Math.random() * 19)}`
            // config: '{}'
          }, () => {
            this.hideProjectForm()
          })
        } else if (formType === 'edit') {
          onEditProject({
            ...values
          //  ...{orgId: Number(values.orgId)}
          }, () => {
            onLoadOrganizationProjects({id: currentOrganization.id})
            this.hideProjectForm()
          })
        }
      }
    })
  }

  private onShowSizeChange = (current, pageSize) => {
    this.setState({
      pageNum: current,
      pageSize
    }, () => {
      const param = {
        pageNum: this.state.pageNum,
        pageSize: this.state.pageSize
      }
      this.getOrganizationProjectsByPagination(param)
    })
  }

  private onPaginationChange = (page) => {
    this.setState({
      pageNum: page
    }, () => {
      const param = {
        pageNum: this.state.pageNum,
        pageSize: this.state.pageSize
      }
      this.getOrganizationProjectsByPagination(param)
    })
  }

  public componentWillReceiveProps (nextProps) {
    const {currentOrganizationProjects} = this.props
    const nextOrgProjects = nextProps.currentOrganizationProjects
    if (nextOrgProjects && nextOrgProjects !== currentOrganizationProjects) {
      this.setState({
        organizationProjects: nextOrgProjects
      })
    }
  }

  private starProject = (id)  => () => {
    const { onStarProject, organizationId } = this.props
    const param = {
      id: Number(organizationId),
      pageNum: this.state.pageNum,
      pageSize: this.state.pageSize
    }
    onStarProject(id, () => {
      this.props.onLoadOrganizationProjects(param)
    })
  }

  private deleteProject = (id) => () => {
    if (id) {
      this.props.onDeleteProject(id)
    }
  }

  private getStarProjectUserList = (id) => () => {
    const { onGetProjectStarUser } = this.props
    onGetProjectStarUser(id)
  }

  public render () {
    const { formVisible, formType, modalLoading, organizationProjects, editFormVisible, currentProject, adminFormVisible } = this.state
    const { currentOrganization, organizationProjectsDetail, onCheckUniqueName, collectProjects, starUserList } = this.props
    let CreateButton = void 0
    if (currentOrganization) {
       CreateButton = ComponentPermission(currentOrganization, CREATE_ORGANIZATION_PROJECT)(Button)
    }
    const addButton =  (
          <Tooltip placement="bottom" title="创建">
            <CreateButton
              type="primary"
              icon="plus"
              onClick={this.showProjectForm('organizationProject')}
            />
          </Tooltip>
      )
    let projectSearchPagination = void 0
    if (organizationProjectsDetail) {
      projectSearchPagination =
        (
        <Pagination
          //  simple={screenWidth < 768 || screenWidth === 768}
          showSizeChanger
          defaultCurrent={2}
          total={organizationProjectsDetail.total}
          onShowSizeChange={this.onShowSizeChange}
          onChange={this.onPaginationChange}
          defaultPageSize={10}
          pageSizeOptions={['10', '15', '20']}
          current={this.state.pageNum}
        />)
    }
    const ProjectItems = Array.isArray(organizationProjects) ? organizationProjects.map((lists, index) => (
      <ProjectItem
        unStar={this.starProject}
        userList={this.getStarProjectUserList}
        starUser={starUserList}
        collectProjects={collectProjects}
        currentOrganization={currentOrganization}
        key={index}
        loginUser={this.props.loginUser}
        options={lists}
        toProject={this.props.toProject}
        deleteProject={this.deleteProject}
        showEditProjectForm={this.showEditProjectForm('edit', lists)}
        onClickCollectProjects={this.props.onClickCollectProjects}
        onLoadCollectProjects={this.props.onLoadCollectProjects}
      />
    )) : ''


    return (
      <div className={styles.listWrapper}>
        <Row>
          <Col span={16}>
            <Input.Search
              placeholder="搜索项目"
              onChange={this.onSearchProject}
            />
          </Col>
          <Col span={1} offset={7}>
              {addButton}
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            {ProjectItems}
          </Col>
        </Row>
        <Row type="flex" justify="end" style={{marginTop: '16px'}}>
          <Col>
            {projectSearchPagination}
          </Col>
        </Row>
        <Modal
          title={null}
          visible={formVisible}
          footer={null}
          onCancel={this.hideProjectForm}
          afterClose={this.afterProjectFormClose}
        >
          <ProjectForm
            type={formType}
            modalLoading={modalLoading}
            onModalOk={this.onModalOk}
            onCheckUniqueName={this.checkUniqueName}
            wrappedComponentRef={this.refHandlers.ProjectForm}
          />
        </Modal>
        <Modal
          wrapClassName="ant-modal-large ant-modal-center"
          title="项目设置"
          visible={editFormVisible}
          footer={null}
          onCancel={this.hideProjectForm}
          afterClose={this.afterProjectEditFormClose}
        >
          <ProjectEditForm
            type={formType}
            modalLoading={modalLoading}
            onModalOk={this.onModalOk}
            deleteProject={this.props.deleteProject}
            currentProject={currentProject}
            onCancel={this.hideProjectForm}
            onCheckUniqueName={this.checkUniqueName}
            onDeleteAdmin={this.deleteAdmin}
            showEditProjectForm={this.showProjectForm('transfer')}
            wrappedComponentRef={this.refHandlers.ProjectEditForm}
          />
        </Modal>
      </div>
    )
  }
}


const mapStateToProps = createStructuredSelector({
  starUserList: makeSelectStarUserList(),
  loginUser: makeSelectLoginUser(),
  organizations: makeSelectOrganizations(),
  currentOrganization: makeSelectCurrentOrganizations(),
  currentOrganizationProjects: makeSelectCurrentOrganizationProjects(),
  currentOrganizationProjectsDetail: makeSelectCurrentOrganizationProjectsDetail(),
  currentOrganizationMembers: makeSelectCurrentOrganizationMembers(),
  collectProjects: makeSelectCollectProjects()
})

export function mapDispatchToProps (dispatch) {
  return {
    onSetCurrentProject: (option) => dispatch(setCurrentProject(option)),
    onStarProject: (id, resolve) => dispatch(unStarProject(id, resolve)),
    onGetProjectStarUser: (id) => dispatch(getProjectStarUser(id)),
    onAddProject: (project, resolve) => dispatch(addProject(project, resolve)),
    onEditProject: (project, resolve) => dispatch(editProject(project, resolve)),
    onLoadOrganizationProjects: (param) => dispatch(loadOrganizationProjects(param)),
    onDeleteProject: (id, resolve) => dispatch(deleteProject(id, resolve)),
    onDeleteOrganizationMember: (id, resolve) => dispatch(deleteOrganizationMember(id, resolve)),
    onChangeOrganizationMemberRole: (id, role, resolve) => dispatch(changeOrganizationMemberRole(id, role, resolve)),
    onClickCollectProjects: (formType, project, resolve) => dispatch(clickCollectProjects(formType, project, resolve)),
    onLoadCollectProjects: () => dispatch(loadCollectProjects()),
    onCheckUniqueName: (pathname, data, resolve, reject) => dispatch(checkNameUniqueAction(pathname, data, resolve, reject))
  }
}

const withConnect = connect(mapStateToProps, mapDispatchToProps)
export default compose(withConnect)(ProjectList)


