import React from 'react';

import AlertActions from '../actions/alertActions';

import LoadingIndicator from '../components/loadingIndicator';
import LoadingError from '../components/loadingError';
import LinkWithConfirmation from '../components/linkWithConfirmation';

import ApiMixin from '../mixins/apiMixin';

import {t} from '../locale';

const GroupTombstones = React.createClass({
  propTypes: {
    orgId: React.PropTypes.string.isRequired,
    projectId: React.PropTypes.string.isRequired
  },

  mixins: [ApiMixin],

  getInitialState() {
    return {
      loading: true,
      tombstones: []
    };
  },

  componentDidMount() {
    this.fetchData();
  },

  fetchData() {
    let {orgId, projectId} = this.props;

    let path = `/projects/${orgId}/${projectId}/tombstone/`;
    this.api.request(path, {
      method: 'GET',
      success: (data, _, jqXHR) => {
        this.setState({
          tombstones: data,
          loading: false
        });
      },
      error: () => {
        this.setState({
          error: true
        });
      }
    });
  },

  undiscard(tombstoneId) {
    // TODO (kt): update this when you scope the API endpoint to the project
    let path = `/tombstone/${tombstoneId}/`;
    this.api.request(path, {
      method: 'DELETE',
      success: data => {
        AlertActions.addAlert({
          message: t('Events similar to these will no longer be filtered'),
          type: 'success'
        });
      },
      error: () => {
        AlertActions.addAlert({
          message: t('We were unable to discard this group'),
          type: 'error'
        });
      }
    });
    this.fetchData();
  },

  renderEmpty() {
    return <div className="box empty">{t('None')}</div>;
  },

  render() {
    if (this.state.loading) return <LoadingIndicator />;

    if (this.state.error) return <LoadingError />;

    let {tombstones} = this.state;
    return (
      <div>
        <div className="row" style={{paddingTop: 10}}>
          <div className="col-sm-8">
            <h5>{t('Discarded Groups')}</h5>
            {tombstones.length
              ? <ul className="group-list">
                  {tombstones.map(data => {
                    return (
                      <li key={data.id} className={data.level}>
                        <div className="event-details">
                          <span className="error-level truncate" title={data.level} />
                          <h3 className="truncate">
                            <span style={{marginRight: 10}}>{data.type}</span>
                            <em>{data.culprit}</em><br />
                          </h3>

                          <div className="event-extra">
                            <div className="event-message truncate">
                              <span className="message">{data.message}</span>
                            </div>
                            <LinkWithConfirmation
                              title={t('Undiscard')}
                              className="btn btn-warning btn-xs"
                              message={t(
                                'Undiscarding this group means that ' +
                                  'incoming events that match this will no longer be discarded. ' +
                                  'New incoming events will count toward your event quota ' +
                                  'and will display on your issues dashboard. ' +
                                  'Are you sure you wish to continue?'
                              )}
                              onConfirm={() => {
                                this.undiscard(data.id);
                              }}>
                              <span>{t('Undiscard')}</span>
                            </LinkWithConfirmation>
                          </div>
                        </div>
                        {data.user && <span>`discarded by ${data.user.name}`</span>}
                      </li>
                    );
                  })}
                </ul>
              : this.renderEmpty()}
          </div>
        </div>
      </div>
    );
  }
});

export default GroupTombstones;