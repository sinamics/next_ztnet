/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import fs from "fs";
import axios, { type AxiosError, type AxiosResponse } from "axios";
import { type NetworkAndMembers } from "~/types/network";
import { APIError } from "~/server/helpers/errorHandler";
import {
  type ZTControllerResponse,
  type HttpResponse,
  type MemberRevisionCounters,
  type ZTControllerCreateNetwork,
  type ZTControllerNodeStatus,
  type ZTControllerStatus,
  type ZTControllerMemberDetails,
  type MemberDeleteInput,
  type MemberDeleteResponse,
  type ZTControllerMemberUpdate,
  type ZTControllerGetPeer,
} from "~/types/ztController";

const ZT_ADDR = process.env.ZT_ADDR || "http://127.0.0.1:9993";
let ZT_SECRET = process.env.ZT_SECRET;

const ZT_FILE =
  process.env.ZT_SECRET_FILE || "/var/lib/zerotier-one/authtoken.secret";

if (!ZT_SECRET) {
  if (process.env.IS_GITHUB_ACTION !== "true") {
    try {
      ZT_SECRET = fs.readFileSync(ZT_FILE, "utf8");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("an error occurred while reading the ZT_SECRET");
    }
  } else {
    // GitHub Actions
    ZT_SECRET = "dummy_text_to_skip_gh";
  }
}
const options = {
  json: true,
  headers: {
    "X-ZT1-Auth": ZT_SECRET,
    "Content-Type": "application/json",
  },
};
/* 
  Controller API for Admin
*/

// Check for controller function and return controller status.
// https://docs.zerotier.com/service/v1/#operation/getControllerStatus

//Get Version
export const get_controller_version = async function () {
  try {
    const { data } = await axios.get(ZT_ADDR + "/controller", options);

    return data as ZTControllerStatus;
  } catch (error) {
    const message = "An error occurred while getting get_controller_version";
    throw new APIError(message, error as AxiosError);
  }
};

// List IDs of all networks hosted by this controller.
// https://docs.zerotier.com/service/v1/#operation/getControllerNetworks

type ZTControllerListNetworks = Array<string>;

// Get all networks
export const get_controller_networks =
  async function (): Promise<ZTControllerListNetworks> {
    try {
      const { data } = await axios.get(
        ZT_ADDR + "/controller/network",
        options
      );
      return data as ZTControllerListNetworks;
    } catch (error) {
      const message = "An error occurred while getting get_controller_networks";
      throw new APIError(
        message,
        axios.isAxiosError(error) ? error : undefined
      );
    }
  };

/* 
  Node status and addressing info
  https://docs.zerotier.com/service/v1/#operation/getStatus
*/

export const get_controller_status = async function () {
  try {
    const { data } = await axios.get(ZT_ADDR + "/status", options);
    return data as ZTControllerNodeStatus;
  } catch (error) {
    const message = "An error occurred while getting get_controller_status";
    throw new APIError(message, error as AxiosError);
  }
};

/* 
  Create new zerotier network
  https://docs.zerotier.com/service/v1/#operation/createNetwork
*/
export const network_create = async (
  name,
  ipAssignment
): Promise<ZTControllerCreateNetwork> => {
  const controllerStatus = await get_controller_status();

  const config = {
    name,
    ...ipAssignment,
  };

  try {
    const response: AxiosResponse = await axios.post(
      `${ZT_ADDR}/controller/network/${controllerStatus.address}______`,
      config,
      options
    );
    return response.data as ZTControllerCreateNetwork;
  } catch (error) {
    const message = "An error occurred while getting network_create";
    throw new APIError(message, error as AxiosError);
  }
};
// delete network
// https://docs.zerotier.com/service/v1/#operation/deleteNetwork

export async function network_delete(nwid: string): Promise<HttpResponse> {
  try {
    const response = await axios.delete(
      `${ZT_ADDR}/controller/network/${nwid}`,
      options
    );

    return { status: response.status, data: undefined };
  } catch (error) {
    const message = "An error occurred while getting network_delete";
    throw new APIError(message, error as AxiosError);
  }
}

// Get Network Member Details by ID
// https://docs.zerotier.com/service/v1/#operation/getControllerNetworkMember

export const network_members = async function (
  nwid: string
): Promise<MemberRevisionCounters> {
  try {
    const members: AxiosResponse = await axios.get(
      `${ZT_ADDR}/controller/network/${nwid}/member/`,
      options
    );

    return members.data as MemberRevisionCounters;
  } catch (error) {
    const message = "An error occurred while getting network_members";
    throw new APIError(message, error as AxiosError);
  }
};

// Get network details
// https://docs.zerotier.com/service/v1/#operation/getNetwork

export const network_detail = async function (
  nwid: string
): Promise<NetworkAndMembers> {
  try {
    // get all members for a specific network
    const members = await network_members(nwid);

    const network: AxiosResponse = await axios.get(
      `${ZT_ADDR}/controller/network/${nwid}`,
      options
    );

    const membersArr: any = [];
    for (const member in members) {
      const memberDetails: AxiosResponse = await axios.get(
        `${ZT_ADDR}/controller/network/${nwid}/member/${member}`,
        options
      );
      membersArr.push(memberDetails.data);
    }
    return {
      network: { ...network.data },
      members: [...membersArr],
    };
  } catch (error) {
    const message = "An error occurred while getting network_detail";
    throw new APIError(message, error as AxiosError);
  }
};

// Get network details
// https://docs.zerotier.com/service/v1/#operation/getNetwork
export const network_update = async function (
  nwid: any,
  data: any
): Promise<Partial<ZTControllerResponse>> {
  try {
    const updated = await axios.post(
      `${ZT_ADDR}/controller/network/${nwid}`,
      data,
      options
    );
    return { network: { ...updated.data } };
  } catch (error) {
    const message = "An error occurred while getting network_update";
    throw new APIError(message, error as AxiosError);
  }
};

// Get Network Member Details by ID
// https://docs.zerotier.com/service/v1/#operation/getControllerNetworkMember

export const member_detail = async function (
  nwid: any,
  id: any
): Promise<ZTControllerMemberDetails> {
  try {
    const response = await axios.get(
      `${ZT_ADDR}/controller/network/${nwid}/member/${id}`,
      options
    );

    return response.data as ZTControllerMemberDetails;
  } catch (error) {
    const message = "An error occurred while getting member_detail";
    throw new APIError(message, error as AxiosError);
  }
};

// Delete Network Member by ID
// https://docs.zerotier.com/service/v1/#operation/deleteControllerNetworkMember

export const member_delete = async ({
  nwid,
  memberId,
}: MemberDeleteInput): Promise<MemberDeleteResponse> => {
  try {
    const response: AxiosResponse = await axios.delete(
      `${ZT_ADDR}/controller/network/${nwid}/member/${memberId}`,
      options
    );
    return response.status as MemberDeleteResponse;
  } catch (error) {
    const message = "An error occurred while getting member_delete";
    throw new APIError(message, error as AxiosError);
  }
};

// Update Network Member by ID
// https://docs.zerotier.com/service/v1/#operation/updateControllerNetworkMember
export const member_update = async (
  nwid: string,
  memberId: string,
  data
): Promise<ZTControllerMemberUpdate> => {
  try {
    const response: AxiosResponse = await axios.post(
      `${ZT_ADDR}/controller/network/${nwid}/member/${memberId}`,
      data,
      options
    );
    return response.data as ZTControllerMemberUpdate;
  } catch (error) {
    const message = "An error occurred while getting member_update";
    throw new APIError(message, error as AxiosError);
  }
};

// Get all peers
// https://docs.zerotier.com/service/v1/#operation/getPeers
export const peers = async (): Promise<ZTControllerGetPeer> => {
  try {
    const response: AxiosResponse = await axios.get(`${ZT_ADDR}/peer`, options);
    return response.data as ZTControllerGetPeer;
  } catch (error) {
    const message = "An error occurred while getting peers";
    throw new APIError(message, error as AxiosError);
  }
};

// Get information about a specific peer by Node ID.
// https://docs.zerotier.com/service/v1/#operation/getPeer
export const peer = async (
  userZtAddress: string
): Promise<ZTControllerGetPeer[]> => {
  try {
    const response: AxiosResponse = await axios.get(
      `${ZT_ADDR}/peer/${userZtAddress}`,
      options
    );

    if (!response.data) return null as ZTControllerGetPeer[];
    return response.data as ZTControllerGetPeer[];
  } catch (error) {
    return null;
  }
};
